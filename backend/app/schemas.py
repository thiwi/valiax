"""Pydantic schema definitions for API request and response models."""

import datetime
from pydantic import BaseModel
from uuid import UUID
from typing import List, Dict


class DBConnectionCreate(BaseModel):
    """
    Schema for creating a new database connection.
    Used when registering a new data source in the system.
    """
    name: str  # Human-readable name for the connection
    connection_string: str  # DSN or URI for connecting to the database


class DBConnectionRead(DBConnectionCreate):
    """
    Schema for reading/displaying a database connection.
    Extends DBConnectionCreate with a unique identifier.
    Used when listing or retrieving connection details.
    """
    id: UUID  # Unique identifier for the connection
    class Config:
        from_attributes = True


class ConnectionTestRequest(BaseModel):
    """
    Schema for testing a database connection.
    Used to validate a connection string before saving.
    """
    connection_string: str  # DSN or URI to be tested


class ConnectionTestResponse(BaseModel):
    """
    Schema representing the result of a connection test.
    Used to indicate if a database connection attempt was successful.
    """
    success: bool  # True if connection succeeded, False otherwise
    detail: str | None = None  # Optional error or status message


class ColumnRuleCreate(BaseModel):
    """
    Schema for creating a new column-level data quality rule.
    Used in rule management interfaces when defining new rules.
    """
    rule_name: str  # Name of the rule
    rule_text: str  # The logic or expression for the rule (e.g., SQL or DSL)
    severity: str  # Severity level (e.g., 'critical', 'warning')
    interval: str  # How often the rule should be checked (e.g., 'daily')
    description: str  # Description of the rule's purpose
    active: bool = True  # Whether the rule is enabled



class ColumnRuleRead(BaseModel):
    """
    Schema for displaying or retrieving a column-level data quality rule.
    Includes metadata and identifiers for rule management.
    """
    id: UUID  # Unique identifier for the rule
    db_connection_id: UUID  # Associated database connection
    table_name: str  # Name of the table the rule applies to
    column_name: str  # Name of the column the rule applies to
    rule_name: str  # Name of the rule
    rule_text: str  # The logic or expression for the rule
    severity: str  # Severity level
    interval: str  # How often the rule is checked
    description: str | None = None  # Optional description
    active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class RuleResultRead(BaseModel):
    """
    Schema for reading the result of a rule evaluation.
    Used to display rule violations or outcomes in dashboards or logs.
    """
    id: UUID  # Unique identifier for the result record
    detected_at: datetime.datetime  # Timestamp when the rule was evaluated
    rule_id: UUID  # Reference to the evaluated rule
    result: Dict  # Arbitrary JSON result (e.g., violation details)

    class Config:
        from_attributes = True


class DashboardKPI(BaseModel):
    """
    Schema for key performance indicators (KPIs) on the dashboard.
    Used to summarize data quality status at a glance.
    """
    total_violations: int  # Total number of rule violations detected
    critical_violations: int  # Number of critical severity violations
    affected_tables: int  # Number of tables with violations
    compliance_rate: float  # Percentage of rules passing (0.0 - 1.0)

    class Config:
        from_attributes = True


class DashboardTrendItem(BaseModel):
    """
    Schema for a single trend data point on the dashboard.
    Used to track rule violation counts over time for visualization.
    """
    date: str   # ISO date string (e.g., '2024-06-01')
    rule_name: str  # Name of the rule being tracked
    count: int  # Number of violations on the given date

    class Config:
        from_attributes = True


# Specific models for top violations in dashboard analytics
class TopRuleItem(BaseModel):
    """
    Schema for representing a rule with the highest number of violations.
    Used in dashboard sections highlighting problematic rules.
    """
    rule_name: str  # Name of the rule
    count: int  # Number of times this rule was violated

    class Config:
        from_attributes = True

class TopTableItem(BaseModel):
    """
    Schema for representing a table with the highest number of violations.
    Used in dashboard analytics to spotlight affected tables.
    """
    table_name: str  # Name of the affected table
    count: int  # Number of violations on this table

    class Config:
        from_attributes = True

class DashboardTopViolations(BaseModel):
    """
    Schema grouping the top rules and tables with the most violations.
    Used for dashboard widgets summarizing most frequent data quality issues.
    """
    top_rules: List[TopRuleItem]  # List of top violated rules
    top_tables: List[TopTableItem]  # List of top affected tables

    class Config:
        from_attributes = True


class DashboardResultItem(BaseModel):
    """Schema for a single rule result shown on the dashboard."""
    id: UUID
    detected_at: datetime.datetime
    rule_id: UUID
    rule_name: str
    result: Dict

    class Config:
        from_attributes = True


class DashboardResultPage(BaseModel):
    """Paged list of DashboardResultItem objects."""
    total: int
    items: List[DashboardResultItem]


class SessionResponse(BaseModel):
    """Simple session identifier returned by ``/api/session``."""
    session_id: str
