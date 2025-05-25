"""
worker.py: Celery worker service for scheduling and dispatching data quality rules.

This module defines a Celery application that, every minute, retrieves the
active rules from the database along with their last execution times and
configured intervals. It calculates which rules are due for execution and
dispatches each to an external HTTP-based rule-runner service. Results
are persisted back into the database for audit and reporting.
"""

# Import Celery core to create the worker and schedule tasks
from celery import Celery
# Import Celery scheduling utilities for defining periodic tasks
from celery.schedules import crontab
# Standard libraries: datetime for timestamps, uuid/random for IDs,
# json/os for serialization and environment access, psycopg2 for PostgreSQL
import datetime, uuid, random, json, os, psycopg2
# HTTP client library used to call the rule-runner endpoint
import requests
# Logging framework for structured and leveled log output
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(name)s:%(message)s')

# Initialize the Celery application with a Redis broker (default if not provided)
app = Celery('worker', broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0'))

# Enforce UTC timezone for all scheduled and task timestamps
app.conf.timezone = 'UTC'

# Define beat schedule: trigger 'check_rules' task every 60 seconds
app.conf.beat_schedule = {
    'check-rules-every-minute': {
        'task': 'worker.check_rules',
        'schedule': 60.0,
    },
}

# Register 'check_rules' as a periodic Celery task
@app.task
def check_rules():
    """
    This task connects to the PostgreSQL database, retrieves all active rules,
    determines which are due to run based on their interval and last run time,
    then calls the rule-runner HTTP service for each due rule.
    """
    # Log the start of the scheduled task execution
    logger.info("check_rules task started")
    # Establish a database connection using the DATABASE_URL environment variable
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    # Retrieve each rule's configured interval and compute its last execution time
    sql = """
        SELECT r.id, r.interval,
               COALESCE(MAX(rr.last_run), r.created_at) AS last_run
        FROM column_rules r
        LEFT JOIN rule_results rr ON r.id = rr.rule_id
        WHERE r.active = TRUE
        GROUP BY r.id, r.interval, r.created_at
    """
    cur.execute(sql)
    rows = cur.fetchall()

    # Map human-readable intervals to timedelta objects for scheduling logic
    interval_map = {
        'hourly': datetime.timedelta(hours=1),
        'daily': datetime.timedelta(days=1),
        'minutely': datetime.timedelta(minutes=1)
    }

    now = datetime.datetime.now(datetime.timezone.utc)
    due_rules = []

    # Iterate over all rules and determine which are due based on the current time
    for rule_id, interval_str, last_run in rows:
        next_run = last_run + interval_map.get(interval_str, datetime.timedelta(minutes=1))
        if now < next_run:
            logger.info("Rule %s not due until %s", rule_id, next_run)
            continue
        due_rules.append(rule_id)

    # Close database resources before sending HTTP requests to the rule-runner
    cur.close()
    conn.close()

    runner_url = os.getenv("RULE_RUNNER_URL", "http://rule-runner.valiax.svc.cluster.local/run")

    # Send an HTTP POST for each due rule to the external rule-runner service
    for rule_id in due_rules:
        payload = {"db_conn_id": str(rule_id), "rule_ids": [rule_id]}
        try:
            resp = requests.post(runner_url, json=payload, timeout=300)
            resp.raise_for_status()
            logger.info("HTTP request succeeded for rule %s", rule_id)
            result = resp.json()
            logger.info("Received result for rule %s: %s", rule_id, result)
        except Exception as e:
            logger.error("Error during HTTP request for rule %s: %s", rule_id, e)
            result = {"error": str(e)}

        # Reconnect to the database and persist each rule execution result
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO rule_results (last_run, rule_id, result) VALUES (%s, %s, %s)",
            (now, rule_id, json.dumps(result))
        )
        conn.commit()
        logger.info("Result for rule %s committed to database", rule_id)
        cur.close()
        conn.close()