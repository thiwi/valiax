-- This script defines tables for tracking the execution of rules and recording their violations.
-- These tables support dashboard reporting by storing metadata about rule runs and detailed violation logs.

-- Enable the "uuid-ossp" extension to generate universally unique identifiers (UUIDs).
-- UUIDs are used as primary keys to ensure uniqueness across distributed systems.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The rule_runs table stores metadata about each execution of a rule.
-- It captures timing, counts, and status information useful for monitoring and reporting.

CREATE TABLE rule_runs (
    -- Unique identifier for the rule run
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Foreign key referencing the rule being evaluated
    rule_id UUID NOT NULL REFERENCES column_rules(id),
    -- Timestamp when the rule evaluation started
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Timestamp when the rule evaluation ended
    end_time TIMESTAMPTZ,
    -- Total duration of the rule evaluation in milliseconds
    duration_ms INTEGER,
    -- Number of rows evaluated by the rule
    checked_rows INTEGER,
    -- Number of rows that failed the rule
    failed_rows INTEGER,
    -- Overall result status of the rule run (e.g., success, failure)
    status VARCHAR(50)
);

-- The violations table logs specific instances where rules were violated.
-- This supports auditing, analysis, and tracking of data quality issues.

CREATE TABLE violations (
    -- Unique identifier for the violation record
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Foreign key referencing the rule that was violated
    rule_id UUID NOT NULL REFERENCES column_rules(id),
    -- Severity level indicating the criticality of the violation
    severity VARCHAR(50) NOT NULL,
    -- Name of the table where the violation occurred
    table_name VARCHAR(255) NOT NULL,
    -- Name of the column where the violation occurred
    column_name VARCHAR(255) NOT NULL,
    -- The specific value that caused the violation
    offending_value TEXT,
    -- Timestamp when the violation was detected
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Processing status of the violation (e.g., open, resolved)
    status VARCHAR(50) NOT NULL
);
