-- Drop the existing table if it exists to ensure the schema changes are applied cleanly by recreating the table from scratch
DROP TABLE IF EXISTS rule_results CASCADE;

-- The rule_results table stores the outcomes of rule checks applied to columns, recording when a rule was triggered and its detailed results
CREATE TABLE IF NOT EXISTS rule_results (
  -- Unique identifier for each rule result entry
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Timestamp of the execution run that produced this result
  last_run TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Timestamp indicating when the rule violation or check was detected
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Foreign key linking to the specific rule that generated this result; cascades deletes to maintain referential integrity
  rule_id UUID NOT NULL REFERENCES column_rules(id) ON DELETE CASCADE,
  -- JSONB column storing the detailed output or payload of the rule check
  result JSONB NOT NULL
);