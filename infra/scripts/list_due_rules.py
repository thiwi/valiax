"""Utility script for listing all rules that are due for execution."""

import os
import json
import psycopg2
from datetime import datetime, timedelta

# Connection string for the application's metadata database. This must be
# provided via the ``MAIN_DB_URL`` environment variable when the script runs.
MAIN_DB_URL = os.environ.get("MAIN_DB_URL")

if not MAIN_DB_URL:
    raise EnvironmentError("MAIN_DB_URL environment variable is not set.")

def get_due_rules():
    """Return a list of rule groups that should be executed now."""

    # Connect to the application's main database to read rule metadata
    conn = psycopg2.connect(MAIN_DB_URL)
    cur = conn.cursor()

    # Fetch all rules whose next scheduled run time has passed. The query
    # groups rule results by ``rule_id`` to determine the last execution time
    # and compares it to the rule's configured interval.
    cur.execute(
        """
        SELECT cr.id::text, cr.db_connection_id::text
        FROM column_rules cr
        LEFT JOIN (
            SELECT rule_id, MAX(last_run) AS last_run
            FROM rule_results
            GROUP BY rule_id
        ) rr ON rr.rule_id = cr.id
        WHERE cr.active = TRUE
          AND (
            rr.last_run IS NULL OR
            (
              cr.interval = 'minutely' AND rr.last_run <= NOW() - INTERVAL '1 minute'
            ) OR (
              cr.interval = 'hourly' AND rr.last_run <= NOW() - INTERVAL '1 hour'
            ) OR (
              cr.interval = 'daily' AND rr.last_run <= NOW() - INTERVAL '1 day'
            ) OR (
              cr.interval = 'weekly' AND rr.last_run <= NOW() - INTERVAL '7 days'
            )
          )
        """
    )

    rows = cur.fetchall()
    conn.close()

    groups = {}
    for rule_id, db_conn_id in rows:
        groups.setdefault(db_conn_id, []).append(rule_id)

    result = [
        {"db_conn_id": db_conn_id, "rule_ids": rule_ids}
        for db_conn_id, rule_ids in groups.items()
    ]

    with open("/tmp/output.json", "w") as f:
        print("Generated output.json content:")
        print(json.dumps(result, indent=2))
        json.dump(result, f)

if __name__ == "__main__":
    get_due_rules()
