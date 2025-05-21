-- Drop and recreate to pick up schema changes
-- ============================================================================
-- Script Purpose:
--   This script creates the `column_rules` table, which is used to store data
--   quality or validation rules that apply to specific columns in external
--   databases. Each rule defines logic, severity, and metadata for auditing
--   and scheduling the evaluation of data quality constraints.
-- ============================================================================

-- Drop the table if it already exists to allow schema updates or changes.
-- This ensures that modifications to the table definition are applied cleanly
-- during development or migrations.
DROP TABLE IF EXISTS column_rules CASCADE;

-- ============================================================================
-- Table: column_rules
--   Models a set of validation or data quality rules that are associated with
--   individual columns in external database tables. Each entry represents a
--   single rule to be applied to a specific column, and includes metadata for
--   scheduling, severity, and auditing.
-- ============================================================================
CREATE TABLE IF NOT EXISTS column_rules (
    -- Unique identifier for each rule, generated using UUIDs for global uniqueness.
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key referencing the database connection this rule belongs to.
    -- Ensures each rule is linked to a specific external database.
    db_connection_id UUID NOT NULL REFERENCES db_connections(id) ON DELETE CASCADE,

    -- Name of the table in the external database where the rule applies.
    table_name VARCHAR(255) NOT NULL,

    -- Name of the column in the external table that this rule targets.
    column_name VARCHAR(255) NOT NULL,

    -- Human-readable name for the rule, used for identification and display.
    rule_name VARCHAR(255) NOT NULL,

    -- The actual logic or expression of the rule, which can be executed to
    -- validate the column's data (e.g., SQL, expressions, or code).
    rule_text TEXT NOT NULL,

    -- Indicates the criticality of the rule (e.g., 'low', 'medium', 'high').
    -- Used for prioritizing rule enforcement and alerting.
    severity VARCHAR(50) NOT NULL DEFAULT 'low',

    -- Optional text providing a description or additional context for the rule.
    description TEXT,

    -- How often the rule should be evaluated (e.g., 'daily', 'hourly').
    -- Used for scheduling rule checks.
    interval VARCHAR(50) NOT NULL DEFAULT 'daily',

    -- Timestamp recording when the rule was created, for auditing purposes.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);