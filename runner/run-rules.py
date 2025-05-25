import os
import json
import datetime
import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

def fetch_rules(main_db_url, rule_ids):
    conn = psycopg2.connect(main_db_url)
    cur = conn.cursor()
    placeholders = ",".join(["%s"] * len(rule_ids))
    sql = f"""
        SELECT r.id, r.rule_text, c.connection_string
        FROM column_rules r
        JOIN db_connections c ON r.db_connection_id = c.id
        WHERE r.id IN ({placeholders})
    """
    params = rule_ids
    cur.execute(sql, params)
    rules = cur.fetchall()
    cur.close()
    conn.close()
    return rules

def exec_rule_sandbox(rule_text, target_conn):
    # Assume this function executes the rule in a sandboxed environment
    # and returns the result
    # Placeholder implementation
    cur = target_conn.cursor()
    try:
        cur.execute(rule_text)
        result = cur.fetchall()
    except Exception as e:
        result = {"error": str(e)}
    cur.close()
    return result

class RunRequest(BaseModel):
    rule_ids: List[str]

@app.post("/run")
def run_rules(request: RunRequest):
    logger.info("run_rules endpoint called")
    logger.info("Received RunRequest with rule_ids=%s", request.rule_ids)
    MAIN_DB_URL = os.getenv("MAIN_DB_URL")
    if not MAIN_DB_URL:
        raise HTTPException(status_code=500, detail="MAIN_DB_URL env var must be set")

    # Fetch and execute
    try:
        rules = fetch_rules(MAIN_DB_URL, request.rule_ids)
    except Exception as e:
        logger.exception("Error fetching rules for rule_ids=%s", request.rule_ids)
        raise HTTPException(status_code=500, detail="Error fetching rules")
    if not rules:
        logger.warning("No rules found for rule_ids=%s", request.rule_ids)
        raise HTTPException(status_code=404, detail="No rules found")

    write_conn = psycopg2.connect(MAIN_DB_URL)
    write_cur = write_conn.cursor()
    results = {}
    for rule_id, rule_text, conn_str in rules:
        logger.info("Processing rule %s with connection %s", rule_id, conn_str)
        ts = datetime.datetime.utcnow().isoformat()
        target_conn = psycopg2.connect(conn_str)
        try:
            try:
                result = exec_rule_sandbox(rule_text, target_conn)
            except Exception as e:
                logger.exception("Error executing sandbox for rule %s", rule_id)
                result = {"error": str(e)}
        finally:
            target_conn.close()
        results[rule_id] = result
        write_cur.execute(
            "INSERT INTO rule_results (rule_id, result) VALUES (%s, %s)",
            (str(rule_id), json.dumps(result))
        )
        write_conn.commit()
        logger.info("Result for rule %s committed to database: %s", rule_id, result)
    write_cur.close()
    write_conn.close()
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80, log_level="info")