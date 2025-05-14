import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class DBConnection(Base):
    """
    Represents a database connection configuration.

    This model stores details about different database connections that can be used
    by the application. Each connection has a unique identifier, a name for easy reference,
    and the actual connection string used to connect to the database.
    """
    __tablename__ = "db_connections"

    # Unique identifier for each DB connection, using UUID for global uniqueness
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human-readable name for the connection (e.g., 'Production DB')
    name = Column(String, nullable=False)

    # The connection string (e.g., a DSN or URL) used to connect to the database
    connection_string = Column(String, nullable=False)


class ColumnRule(Base):
    """
    Defines a rule that applies to a specific column in a database table.

    This model captures validation or quality rules that should be enforced on columns
    of tables in the connected databases. It includes details such as the rule's name,
    the SQL or logic text of the rule, severity, and the frequency at which it should run.
    """
    __tablename__ = "column_rules"

    # Unique identifier for each rule, using UUID for global uniqueness
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key linking this rule to a specific database connection.
    # Cascade delete ensures rules are deleted if the DB connection is removed.
    db_connection_id = Column(UUID(as_uuid=True), ForeignKey("db_connections.id", ondelete="CASCADE"), nullable=False)

    # The name of the table in the database to which this rule applies
    table_name = Column(String, nullable=False)

    # The name of the column within the table that this rule targets
    column_name = Column(String, nullable=False)

    # A short name or identifier for the rule (e.g., 'NotNullCheck')
    rule_name = Column(String, nullable=False)

    # The actual rule logic or SQL expression to be evaluated on the column
    rule_text = Column(Text, nullable=False)

    # Severity level of the rule violation (default is 'low'), e.g., 'low', 'medium', 'high'
    severity = Column(String, nullable=False, default='low')

    # Frequency at which the rule should be checked, e.g., 'daily', 'hourly' (default 'daily')
    interval = Column(String, nullable=False, default='daily')

    # Optional detailed description explaining the purpose or details of the rule
    description = Column(Text, nullable=True)

    # Relationship to RuleResult objects that store the outcomes of rule evaluations.
    # Cascade delete ensures related results are deleted if the rule is removed.
    results = relationship("RuleResult", back_populates="rule", cascade="all, delete-orphan")

class RuleResult(Base):
    """
    Stores the results of evaluating a ColumnRule at a given point in time.

    This model captures the outcome of running a rule on a column, including when the
    rule was evaluated and the resulting data or details. This allows tracking and auditing
    of rule execution over time.
    """
    __tablename__ = "rule_results"

    # Unique identifier for each rule result entry, using UUID for global uniqueness
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Timestamp when the rule was evaluated, defaults to the current time on the server
    detected_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Foreign key linking this result to the specific ColumnRule it belongs to.
    # Cascade delete ensures results are deleted if the rule is removed.
    rule_id = Column(UUID(as_uuid=True), ForeignKey("column_rules.id", ondelete="CASCADE"), nullable=False)

    # JSON field to store detailed results or metadata about the rule execution; optional
    result = Column(JSON, nullable=True)  # optional: store rule execution details

    # Relationship back to the ColumnRule that generated this result
    rule = relationship("ColumnRule", back_populates="results")

class RuleRun(Base):
    """
    Represents a single execution of a rule, including metadata like runtime and affected rows.
    """
    __tablename__ = "rule_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("column_rules.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_ms = Column(String, nullable=True)
    checked_rows = Column(String, nullable=True)
    failed_rows = Column(String, nullable=True)
    status = Column(String, nullable=True)