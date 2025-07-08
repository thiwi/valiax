"""HTTP service that executes stored data quality rules in isolation."""

import os
import json
import datetime
import psycopg2
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import argparse
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Comma-separated list of modules allowed to be imported in sandboxed rules
DEFAULT_ALLOWED_IMPORTS = [m.strip() for m in os.getenv("RUNNER_ALLOWED_IMPORTS", "pandas,datetime,psycopg2").split(",") if m.strip()]

def fetch_rules(main_db_url: str, rule_ids: List[str]):
    """Retrieve rule definitions and their target connection strings.

    Parameters
    ----------
    main_db_url : str
        Connection string for the application's main database.
    rule_ids : List[str]
        List of rule UUIDs to fetch.

    Returns
    -------
    list[tuple]
        Tuples of ``(rule_id, rule_text, connection_string)``.
    """
    placeholders = ",".join(["%s"] * len(rule_ids))
    sql = f"""
        SELECT r.id, r.rule_text, c.connection_string
        FROM column_rules r
        JOIN db_connections c ON r.db_connection_id = c.id
        WHERE r.id IN ({placeholders})
    """
    with psycopg2.connect(main_db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, rule_ids)
            return cur.fetchall()

import multiprocessing


def exec_rule_sandbox(rule_text, target_conn, allowed_imports: Optional[List[str]] = None):
    """Execute ``rule_text`` as Python code using ``target_conn`` in a restricted
    sandbox.

    The sandbox runs the rule in a separate process which is terminated after one
    hour. Imports are currently unrestricted but a list of ``allowed_imports``
    can be provided in the future to limit which modules may be imported.
    The executed code should store its result in a variable named ``result`` or
    provide a callable ``rule`` which returns the result.
    """

    def worker(code, conn, out, imports):
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
            "Exception": Exception,
        }

        def checked_import(name, globals=None, locals=None, fromlist=(), level=0):
            base = name.split(".")[0]
            if imports is not None and base not in imports:
                raise ImportError(f"Import of '{base}' is not allowed")
            return __import__(name, globals, locals, fromlist, level)

        # Allow all imports if ``imports`` is None
        safe_builtins["__import__"] = checked_import

        # Locals available to the executed rule
        local_env = {
            "target_conn": conn,
            "pd": pd,
            "datetime": datetime,
            "psycopg2": psycopg2,
        }

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
    proc = multiprocessing.Process(target=worker, args=(rule_text, target_conn, result_holder, allowed_imports))
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
    """Execute the given rules and store their results.

    Each rule is fetched from the main database, executed in an isolated
    subprocess, and the resulting data is written back to ``rule_results``.
    """
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

    results = {}
    with psycopg2.connect(MAIN_DB_URL) as write_conn:
        with write_conn.cursor() as write_cur:
            for rule_id, rule_text, conn_str in rules:
                logger.info("Processing rule %s with connection %s", rule_id, conn_str)
                target_conn = psycopg2.connect(conn_str)
                try:
                    try:
                        result = exec_rule_sandbox(rule_text, target_conn, allowed_imports=DEFAULT_ALLOWED_IMPORTS)
                    except Exception as e:
                        logger.exception("Error executing sandbox for rule %s", rule_id)
                        result = {"error": str(e)}
                finally:
                    target_conn.close()
                results[rule_id] = {
                    "result": result,
                    "db_connection": conn_str
                }
                write_cur.execute(
                    "INSERT INTO rule_results (rule_id, result) VALUES (%s, %s)",
                    (str(rule_id), json.dumps(results[rule_id]))
                )
                write_conn.commit()
                logger.info(
                    "Result for rule %s committed to database: %s",
                    rule_id,
                    results[rule_id]
                )
    return {"results": results}

def run_custom_code(code_str: str, conn_str: str):
    """Execute arbitrary ``code_str`` using a database connection."""
    conn = psycopg2.connect(conn_str)
    try:
        result = exec_rule_sandbox(code_str, conn, allowed_imports=DEFAULT_ALLOWED_IMPORTS)
    finally:
        conn.close()
    print(json.dumps({"result": result}, default=str))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run stored rules or execute custom code.")
    parser.add_argument("--code", help="Python code string or path to file to execute")
    parser.add_argument("--conn", help="Database connection string")
    args, unknown = parser.parse_known_args()

    if args.code and args.conn:
        code_content = args.code
        if os.path.exists(args.code):
            with open(args.code, "r") as f:
                code_content = f.read()
        run_custom_code(code_content, args.conn)
    else:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=80, log_level="info")
