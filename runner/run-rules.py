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

import multiprocessing


def exec_rule_sandbox(rule_text, target_conn):
    """Execute ``rule_text`` as Python code using ``target_conn`` in a restricted
    sandbox.

    The sandbox disables imports and file/network access by limiting built-ins
    and runs the code in a separate process which is terminated after one hour.
    The executed code should store its result in a variable named ``result``.
    """

    def worker(code, conn, out):
        # Define a minimal set of safe builtins
        safe_builtins = {
            "True": True,
            "False": False,
            "None": None,
            "abs": abs,
            "min": min,
            "max": max,
            "sum": sum,
            "range": range,
            "len": len,
            "int": int,
            "float": float,
            "str": str,
            "bool": bool,
            "list": list,
            "dict": dict,
            "set": set,
            "tuple": tuple,
        }

        # Block import statements to avoid access to the outside environment
        def blocked_import(*_args, **_kwargs):  # pragma: no cover - simple guard
            raise ImportError("Importing modules is disabled in sandbox")

        safe_builtins["__import__"] = blocked_import

        # Locals available to the executed rule
        local_env = {"target_conn": conn}

        try:
            exec(code, {"__builtins__": safe_builtins}, local_env)
            if "result" in local_env:
                out["result"] = local_env["result"]
            elif "rule" in local_env and callable(local_env["rule"]):
                out["result"] = local_env["rule"](conn)
            else:
                out["result"] = None
        except Exception as e:  # pragma: no cover - error path
            out["error"] = str(e)

    manager = multiprocessing.Manager()
    result_holder = manager.dict()
    proc = multiprocessing.Process(target=worker, args=(rule_text, target_conn, result_holder))
    proc.start()
    proc.join(3600)  # 1 hour timeout
    if proc.is_alive():
        proc.terminate()
        proc.join()
        return {"error": "timeout"}

    return result_holder.get("result", result_holder.get("error"))

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
