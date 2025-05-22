#!/usr/bin/env python3
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import psycopg2
import datetime
import json

# Whitelist imports for the sandbox
import pandas
import sklearn

def fetch_rules(main_db_url, db_conn_id, rule_ids):
    """Load rule_text + connection_string for the given rule UUIDs and db_conn_id."""
    conn = psycopg2.connect(main_db_url)
    cur  = conn.cursor()
    placeholders = ",".join(["%s"] * len(rule_ids))
    sql = f"""
        SELECT r.id, r.rule_text, c.connection_string
        FROM column_rules r
        JOIN db_connections c ON r.db_connection_id = c.id
        WHERE r.db_connection_id = %s
          AND r.id IN ({placeholders})
    """
    params = [db_conn_id] + rule_ids
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def exec_rule_sandbox(rule_text, target_conn):
    """
    Execute the rule in a minimal globals scope so that:
    - Only Exception, str, pandas, sklearn are importable
    - No __import__ or other builtins are available
    """
    safe_globals = {
        "__builtins__": {"Exception": Exception, "str": str},
        "pandas": pandas,
        "sklearn": sklearn,
    }
    safe_locals = {}
    # Define the rule() function
    exec(rule_text, safe_globals, safe_locals)
    fn = safe_locals.get("rule")
    if not callable(fn):
        return {"error": "No rule() function defined"}
    try:
        return fn(target_conn)
    except Exception as e:
        return {"error": str(e)}


# --- FastAPI app and models ---
app = FastAPI()

class RunRequest(BaseModel):
    db_conn_id: str
    rule_ids: List[str]


# --- API Endpoint ---
@app.post("/run")
def run_rules(request: RunRequest):
    MAIN_DB_URL = os.getenv("MAIN_DB_URL")
    if not MAIN_DB_URL:
        raise HTTPException(status_code=500, detail="MAIN_DB_URL env var must be set")

    # Fetch and execute
    rules = fetch_rules(MAIN_DB_URL, request.db_conn_id, request.rule_ids)
    write_conn = psycopg2.connect(MAIN_DB_URL)
    write_cur = write_conn.cursor()
    results = {}
    for rule_id, rule_text, conn_str in rules:
        ts = datetime.datetime.utcnow().isoformat()
        print(f"[{ts}] ▶ Executing rule {rule_id}")
        target_conn = psycopg2.connect(conn_str)
        try:
            result = exec_rule_sandbox(rule_text, target_conn)
        finally:
            target_conn.close()
        ts2 = datetime.datetime.utcnow().isoformat()
        print(f"[{ts2}] ✔ Rule {rule_id} result: {json.dumps(result)}")
        results[rule_id] = result
        # Persist the result into rule_results table
        write_cur.execute(
            "INSERT INTO rule_results (rule_id, result) VALUES (%s, %s)",
            (str(rule_id), json.dumps(result))
        )
        write_conn.commit()
    write_cur.close()
    write_conn.close()
    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)