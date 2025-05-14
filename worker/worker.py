# This worker is responsible for executing scheduled rule evaluations using Celery.
# It periodically checks active rules in the database, generates dummy results for each,
# and stores these results back into the database for further processing or analysis.

from celery import Celery
from celery.schedules import crontab
import datetime, uuid, random, json, os, psycopg2

# Initialize the Celery application with a broker URL.
# The broker is the message queue that Celery uses to send and receive task messages.
# Here, it defaults to a Redis server if the environment variable is not set.
app = Celery('worker', broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0'))

# Set the timezone for the Celery app to UTC to ensure consistent time references.
app.conf.timezone = 'UTC'

# Configure the beat scheduler to run the 'check_rules' task every 60 seconds.
# Celery Beat is a scheduler that kicks off tasks at regular intervals.
app.conf.beat_schedule = {
    'check-rules-every-minute': {
        'task': 'worker.check_rules',
        'schedule': 60.0,
    },
}

@app.task
def check_rules():
    """
    This task connects to the PostgreSQL database, retrieves all active rules,
    generates dummy results for each rule, and inserts these results into the rule_results table.
    """
    # Establish a connection to the database using the DATABASE_URL environment variable.
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()

    # Retrieve all active rules from the column_rules table.
    cur.execute("SELECT id FROM column_rules WHERE active = TRUE")
    rows = cur.fetchall()

    for (rule_id,) in rows:
        # Use the current UTC time for timestamping to avoid timezone inconsistencies.
        now = datetime.datetime.now(datetime.timezone.utc)

        # Generate a dummy result dictionary with:
        # - 'timestamp': current UTC time in ISO 8601 format,
        # - 'price': a random float between 0 and 100 rounded to 2 decimals,
        # - 'violations': a list of 3 unique UUID strings representing dummy violation IDs.
        result = {
            "timestamp": now.isoformat(),
            "price": round(random.uniform(0, 100), 2),
            "violations": [str(uuid.uuid4()) for _ in range(3)]
        }

        # Insert the generated result into the rule_results table with the detected timestamp and rule ID.
        cur.execute(
            "INSERT INTO rule_results (detected_at, rule_id, result) VALUES (%s, %s, %s)",
            (now, rule_id, json.dumps(result))
        )
        # Commit the transaction to save changes to the database.
        conn.commit()

    # Close the cursor and database connection to free resources.
    cur.close()
    conn.close()