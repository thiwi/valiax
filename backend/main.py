"""
main.py

This is the main FastAPI application for the Valiax backend. It provides a REST API and WebSocket endpoints
for managing database connections, inspecting tables and columns, managing data quality rules, and interacting
with a language model (LLM) microservice for chat functionality.

Key Features:
- Manage and test connections to external databases
- Inspect tables and columns of connected databases
- Create, read, update, and delete data quality rules for specific columns
- Provide dashboard metrics and trends for data quality violations
- Forward chat messages to an external LLM microservice via REST and WebSocket

Intended for use with a frontend (e.g., React) and an LLM microservice.
"""
import os
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
import datetime
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

import logging
logger = logging.getLogger(__name__)

# Import real dashboard CRUD helpers
from app.crud import (
    get_dashboard_kpis,
    get_dashboard_trends,
    get_dashboard_top_violations,
    get_dashboard_results,
)

# Models & CRUD aus dem Unterpaket backend.app
from app.models import DBConnection, ColumnRule
from app import crud, schemas
from app.database import get_db
from app.schemas import ConnectionTestRequest, ConnectionTestResponse
from app.schemas import DashboardKPI, DashboardTrendItem, DashboardTopViolations, DashboardResultItem

app = FastAPI()

# Enable CORS to allow the frontend (e.g. React) to communicate with this API.
origins_env = os.getenv("CORS_ORIGINS", "*")
if origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL of the external LLM (language model) microservice.
LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://llm_service:9000/ask")

async def query_llm(prompt: str) -> str:
    """
    Sends a prompt to the LLM microservice and returns its response.

    Args:
        prompt (str): The user prompt/question to send to the LLM.

    Returns:
        str: The response from the LLM microservice.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(LLM_SERVICE_URL, json={"prompt": prompt})
        resp.raise_for_status()
        data = resp.json()
    return data.get("response", "")

@app.post("/api/test-connection", response_model=ConnectionTestResponse)
def test_connection(req: ConnectionTestRequest):
    """
    Test whether a database can be reached using the provided connection string.

    Args:
        req (ConnectionTestRequest): Contains the database connection string.

    Returns:
        ConnectionTestResponse: Indicates if the connection was successful.
    """
    try:
        # Attempt to create an engine and connect to the database with a timeout.
        engine = create_engine(req.connection_string, connect_args={"connect_timeout": 5})
        conn = engine.connect()
        conn.close()
        return ConnectionTestResponse(success=True, detail="Connection successful")
    except Exception as e:
        # Raise an HTTP error if the connection could not be established.
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/db-connections", response_model=list[schemas.DBConnectionRead])
def list_connections(db: Session = Depends(get_db)):
    """
    List all configured database connections.

    Args:
        db (Session): Database session dependency.

    Returns:
        List[DBConnectionRead]: List of saved database connections.
    """
    return crud.get_db_connections(db)

@app.post("/api/db-connections", response_model=schemas.DBConnectionRead)
def add_connection(payload: schemas.DBConnectionCreate, db: Session = Depends(get_db)):
    """
    Create and save a new database connection.

    Args:
        payload (DBConnectionCreate): Connection details (name, connection string, etc).
        db (Session): Database session dependency.

    Returns:
        DBConnectionRead: The created database connection object.
    """
    return crud.create_db_connection(db, payload)

@app.delete("/api/db-connections/{connection_id}", status_code=204)
def delete_connection(connection_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a database connection by its UUID.

    Args:
        connection_id (UUID): The ID of the connection to delete.
        db (Session): Database session dependency.
    """
    if not crud.delete_db_connection(db, connection_id):
        raise HTTPException(status_code=404, detail="Connection not found")

@app.get("/api/db-connections/{connection_id}/tables", response_model=list[str])
def list_tables(connection_id: UUID, db: Session = Depends(get_db)):
    """
    List all table names for a given database connection.

    Args:
        connection_id (UUID): ID of the database connection.
        db (Session): Database session dependency.

    Returns:
        List[str]: List of table names.
    """
    # Look up the DBConnection object by ID
    conn_obj = db.query(DBConnection).filter(DBConnection.id == connection_id).first()
    if not conn_obj:
        raise HTTPException(status_code=404, detail="Connection not found")
    # Create an SQLAlchemy engine for this connection string
    engine = create_engine(conn_obj.connection_string)
    # Use SQLAlchemy inspector to list tables
    inspector = inspect(engine)
    return inspector.get_table_names()

@app.get("/api/db-connections/{connection_id}/tables/{table_name}/columns", response_model=List[str])
def list_table_columns(connection_id: UUID, table_name: str, db: Session = Depends(get_db)):
    """
    List all column names for a specific table in a given database connection.

    Args:
        connection_id (UUID): ID of the database connection.
        table_name (str): Name of the table.
        db (Session): Database session dependency.

    Returns:
        List[str]: List of column names.
    """
    # Retrieve the connection record
    conn_obj = db.query(DBConnection).filter(DBConnection.id == connection_id).first()
    if not conn_obj:
        raise HTTPException(status_code=404, detail="Connection not found")
    # Create engine and inspector for the target database
    engine = create_engine(conn_obj.connection_string)
    inspector = inspect(engine)
    # Fetch column information for the specified table
    cols_info = inspector.get_columns(table_name)
    # Extract and return the column names
    return [col["name"] for col in cols_info]

@app.post(
    "/api/db-connections/{connection_id}/tables/{table_name}/columns/{column_name}/rules",
    response_model=schemas.ColumnRuleRead
)
def add_rule_to_column(
    connection_id: UUID,
    table_name: str,
    column_name: str,
    rule: schemas.ColumnRuleCreate,
    db: Session = Depends(get_db)
):
    """
    Add a new data quality rule to a specific column in a table.

    Args:
        connection_id (UUID): Database connection ID.
        table_name (str): Table name.
        column_name (str): Column name.
        rule (ColumnRuleCreate): Rule parameters.
        db (Session): Database session dependency.

    Returns:
        ColumnRuleRead: The created column rule.
    """
    # Ensure the database connection exists
    db_conn = db.query(DBConnection).filter(DBConnection.id == connection_id).first()
    if not db_conn:
        raise HTTPException(status_code=404, detail="Database connection not found")

    # Create and return the new column rule using CRUD helper
    new_rule = crud.create_column_rule(
        db, connection_id, table_name, column_name,
        rule.rule_name, rule.rule_text, rule.severity, rule.interval, rule.description
    )
    logger.info(
        f"Endpoint add_rule_to_column: Created ColumnRule id={new_rule.id} "
        f"for connection {connection_id}, table={table_name}, column={column_name}"
    )
    return new_rule


# List all rules for a given column
@app.get(
    "/api/db-connections/{connection_id}/tables/{table_name}/columns/{column_name}/rules",
    response_model=List[schemas.ColumnRuleRead]
)
def list_rules_for_column(
    connection_id: UUID,
    table_name: str,
    column_name: str,
    db: Session = Depends(get_db)
):
    """
    List all data quality rules for a specific column.

    Args:
        connection_id (UUID): Database connection ID.
        table_name (str): Table name.
        column_name (str): Column name.
        db (Session): Database session dependency.

    Returns:
        List[ColumnRuleRead]: List of rules for the column.
    """
    # Retrieve the connection record
    db_conn = db.query(DBConnection).filter(DBConnection.id == connection_id).first()
    if not db_conn:
        raise HTTPException(status_code=404, detail="Database connection not found")
    # Query all rules for this column in the ColumnRule table
    rules = db.query(ColumnRule).filter_by(
        db_connection_id=connection_id,
        table_name=table_name,
        column_name=column_name
    ).all()
    return rules


# Update a rule for a given column
@app.put(
    "/api/db-connections/{connection_id}/tables/{table_name}/columns/{column_name}/rules/{rule_id}",
    response_model=schemas.ColumnRuleRead
)
def update_rule(
    connection_id: UUID,
    table_name: str,
    column_name: str,
    rule_id: UUID,
    updated: schemas.ColumnRuleCreate,
    db: Session = Depends(get_db)
):
    """
    Update an existing data quality rule for a column.

    Args:
        connection_id (UUID): Database connection ID.
        table_name (str): Table name.
        column_name (str): Column name.
        rule_id (UUID): Rule ID to update.
        updated (ColumnRuleCreate): Updated rule data.
        db (Session): Database session dependency.

    Returns:
        ColumnRuleRead: The updated rule.
    """
    # Retrieve the connection record to ensure it exists
    db_conn = db.query(DBConnection).filter(DBConnection.id == connection_id).first()
    if not db_conn:
        raise HTTPException(status_code=404, detail="Database connection not found")
    # Update and return the rule using CRUD helper
    rule = crud.update_column_rule(db, rule_id, updated.rule_name, updated.rule_text, updated.description, updated.severity)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@app.get(
    "/api/column-rules/{rule_name}",
    response_model=schemas.ColumnRuleRead
)
def get_rule_by_name(rule_name: str, db: Session = Depends(get_db)):
    """
    Retrieve a single ColumnRule by its rule_name.

    Args:
        rule_name (str): Name of the rule to fetch.
        db (Session): Database session dependency.

    Returns:
        ColumnRuleRead: The matching rule if found.
    """
    rule = db.query(ColumnRule).filter(ColumnRule.rule_name == rule_name).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@app.get("/api/db-connections/{connection_id}/rules", response_model=List[str])
def list_rule_names(connection_id: UUID, db: Session = Depends(get_db)):
    """Return all rule names for a given connection."""
    return crud.get_rule_names(db, connection_id)

@app.get("/api/dashboard/kpis", response_model=DashboardKPI)
def dashboard_kpis(
    db_conn_id: UUID = Query(..., alias="db_conn_id"),
    date_from: datetime.date | None = Query(None),
    date_to: datetime.date | None = Query(None),
    db: Session = Depends(get_db)
):
    """
    Return KPI metrics for a given database connection, optionally filtered by date range.

    Args:
        db_conn_id (UUID): Database connection ID.
        date_from (date, optional): Start of date range.
        date_to (date, optional): End of date range.
        db (Session): Database session dependency.

    Returns:
        DashboardKPI: KPI summary statistics.
    """
    return get_dashboard_kpis(db, db_conn_id, date_from, date_to)

@app.get("/api/dashboard/trends", response_model=List[DashboardTrendItem])
def dashboard_trends(
    db_conn_id: UUID = Query(..., alias="db_conn_id"),
    date_from: datetime.date | None = Query(None),
    date_to: datetime.date | None = Query(None),
    db: Session = Depends(get_db)
):
    """
    Return trend data (date, count) for a given database connection, optionally filtered by date.

    Args:
        db_conn_id (UUID): Database connection ID.
        date_from (date, optional): Start of date range.
        date_to (date, optional): End of date range.
        db (Session): Database session dependency.

    Returns:
        List[DashboardTrendItem]: List of date/count pairs for violations.
    """
    return get_dashboard_trends(db, db_conn_id, date_from, date_to)

@app.get("/api/dashboard/top-violations", response_model=DashboardTopViolations)
def dashboard_top_violations(
    db_conn_id: UUID = Query(..., alias="db_conn_id"),
    date_from: datetime.date | None = Query(None),
    date_to: datetime.date | None = Query(None),
    db: Session = Depends(get_db)
):
    """
    Return top rules and tables by violation count, optionally filtered by date range.

    Args:
        db_conn_id (UUID): Database connection ID.
        date_from (date, optional): Start of date range.
        date_to (date, optional): End of date range.
        db (Session): Database session dependency.

    Returns:
        DashboardTopViolations: Top rules and tables by violations.
    """
    return get_dashboard_top_violations(db, db_conn_id, date_from, date_to)


@app.get("/api/dashboard/results", response_model=List[DashboardResultItem])
def dashboard_results(
    db_conn_id: UUID = Query(..., alias="db_conn_id"),
    date_from: datetime.date | None = Query(None),
    date_to: datetime.date | None = Query(None),
    limit: int = Query(100),
    rules: List[str] | None = Query(None),
    db: Session = Depends(get_db),
):
    """Return recent rule results for a connection."""
    return get_dashboard_results(db, db_conn_id, date_from, date_to, limit, rules)

@app.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    """
    WebSocket endpoint for chat functionality.

    Forwards each client message to the LLM microservice and sends the LLM's response back to the client.
    This enables real-time conversational AI for the frontend.

    Args:
        websocket (WebSocket): The WebSocket connection.
    """
    await websocket.accept()
    try:
        while True:
            # Receive JSON data from the client (expects a "message" field)
            data = await websocket.receive_json()
            user_msg = data.get("message", "")
            # Forward the user's message to the external LLM microservice and await response
            bot_reply = await query_llm(user_msg)
            # Send the LLM's reply back to the client
            await websocket.send_json({"response": bot_reply})
    except WebSocketDisconnect:
        # Handle client disconnects gracefully
        print("Client disconnected")