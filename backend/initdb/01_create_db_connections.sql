-- This script initializes the database by creating the necessary table to store external database connection information used by the backend application.

-- Enable the uuid-ossp extension to allow generation of universally unique identifiers (UUIDs) for primary keys.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for storing database connections used by the backend
CREATE TABLE IF NOT EXISTS db_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Unique identifier for each connection entry, generated as a UUID to ensure global uniqueness
  name TEXT NOT NULL,                                -- Human-readable name for the connection; required for identifying the connection
  connection_string TEXT NOT NULL                    -- Connection string containing the details needed to connect to the external database; required for establishing the connection
);