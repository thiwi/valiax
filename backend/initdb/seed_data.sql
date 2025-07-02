BEGIN;

-- This seed script populates the database with initial demo data including database connections,
-- column validation rules, simulated rule check results, violation records, and rule execution runs.
-- It helps set up a realistic environment for testing and development by providing example entries
-- across multiple tables related to data quality monitoring.

-- Insert demo database connections into the db_connections table.
-- Columns:
--   id: unique identifier for the connection (UUID)
--   name: friendly name of the database connection
--   connection_string: connection details including protocol, user credentials, host, port, and database name
-- These entries represent two separate ecommerce database instances.
INSERT INTO db_connections (id, name, connection_string) VALUES
('848bdf25-427a-42c0-9739-e6926f0dd050', 'EcommerceDB1', 'postgresql://ecom_user:secret@ecommerce-db-1:5432/ecommerce'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a', 'EcommerceDB2', 'postgresql://ecom_user:secret@ecommerce-db-2:5432/ecommerce');

INSERT INTO column_rules (db_connection_id, table_name, column_name, rule_name, rule_text, severity, description, interval) VALUES
('848bdf25-427a-42c0-9739-e6926f0dd050','customers','email','NonEmptyEmail','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM customers WHERE email = ''")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','low','Emails must not be empty','daily'),
('848bdf25-427a-42c0-9739-e6926f0dd050','order_items','quantity','PositiveQuantity','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM order_items WHERE quantity <= 0")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','medium','Order item quantity must be positive','daily'),
('848bdf25-427a-42c0-9739-e6926f0dd050','products','price','PositivePrice','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM products WHERE price <= 0")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','medium','Product price must be positive','daily'),
('848bdf25-427a-42c0-9739-e6926f0dd050','customers','email_verified','NotNullSignup','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM customers WHERE email_verified IS NULL")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','low','Email verified flag must not be null','daily'),
('848bdf25-427a-42c0-9739-e6926f0dd050','orders','customer_id','ValidCustomer','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM orders WHERE customer_id NOT IN (SELECT id FROM customers)")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','critical','Order must have valid customer','daily'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a','clients','full_name','NonEmptyName','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM clients WHERE full_name = ''")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','low','Client full name must not be empty','daily'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a','clients','contact_email','NonEmptyContactEmail','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM clients WHERE contact_email = ''")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','medium','Contact email must not be empty','daily'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a','items','cost_per_unit','PositiveCost','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM items WHERE cost_per_unit <= 0")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','low','Item cost must be positive','daily'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a','purchases','purchase_status','ValidStatus','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM purchases WHERE purchase_status NOT IN (''''shipped'''',''''processing'''',''''cancelled'''')")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','critical','Purchase status must be valid','daily'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a','purchase_lines','count','PositiveCount','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM purchase_lines WHERE count <= 0")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','medium','Purchase line count must be positive','daily'),
('a0069953-3266-44ee-b8c8-4d629a3b4e8a','purchase_lines','price_each','PositivePrice','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM purchase_lines WHERE price_each <= 0")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','medium','Purchase line price must be positive','daily'),
('848bdf25-427a-42c0-9739-e6926f0dd050','order_items','unit_price','NegativeUnitPricePython','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM order_items WHERE unit_price < 0")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
','medium','find negative prices','minutely'),
('848bdf25-427a-42c0-9739-e6926f0dd050','products','price','NegativePriceCheck','def rule(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM products WHERE price < 0")
        result = [row[0] for row in cursor.fetchall()]
    except Exception as e:
        result = {"error": str(e)}
    finally:
        cursor.close()
','medium','detect negative product prices','minutely');

-- Insert simulated rule check results with failure status into the rule_results table.
-- This uses a SELECT statement to generate multiple entries per rule with randomized timestamps and error details.
-- Columns:
--   detected_at: timestamp when the rule violation was detected, randomized up to 30 days ago
--   rule_id: references the rule from column_rules table
--   result: JSONB object containing detailed result info including:
--     - timestamp: current timestamp formatted as ISO string
--     - status: 'failure' indicating rule violation
--     - checked_rows: number of rows checked (fixed at 100 here)
--     - failed_rows: randomized count of failing rows between 1 and 10
--     - errors: array of random error codes (integers) to simulate error details
--     - duration_ms: randomized execution duration in milliseconds
-- The CROSS JOIN LATERAL and generate_series create multiple such entries per rule to simulate multiple checks.
INSERT INTO rule_results (last_run, detected_at, rule_id, result)
SELECT
  NOW() - ((random() * 30) || ' days')::interval AS last_run,
  NOW() - ((random() * 30) || ' days')::interval AS detected_at,
  cr.id AS rule_id,
  jsonb_build_object(
    'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'status', 'failure',
    'checked_rows', 100,
    'failed_rows', (floor(random()*10+1))::int,
    'errors', jsonb_build_array(
      (floor(random()*100))::int,
      (floor(random()*100))::int,
      (floor(random()*100))::int,
      (floor(random()*100))::int,
      (floor(random()*100))::int
    ),
    'duration_ms', round((random()*100+10)::numeric, 1)
  ) AS result
FROM column_rules cr
CROSS JOIN LATERAL (
  -- Generate between 50 and 100 failure records per rule
  SELECT (floor(random()*51)+50)::int AS cnt
) AS counts
CROSS JOIN generate_series(1, counts.cnt) AS g(i);

-- Insert simulated rule check results with success status into the rule_results table.
-- Similar structure to the failure inserts, but status is 'success' and failed_rows is zero.
-- The errors field is an empty JSON array.
-- Generates between 200 and 400 success records per rule to simulate mostly passing checks.
INSERT INTO rule_results (last_run, detected_at, rule_id, result)
SELECT
  NOW() - ((random() * 30) || ' days')::interval AS last_run,
  NOW() - ((random() * 30) || ' days')::interval AS detected_at,
  cr.id AS rule_id,
  jsonb_build_object(
    'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'status', 'success',
    'checked_rows', 100,
    'failed_rows', 0,
    'errors', '[]'::jsonb,
    'duration_ms', round((random()*100+10)::numeric, 1)
  ) AS result
FROM column_rules cr
CROSS JOIN LATERAL (
  -- Generate between 200 and 400 success records per rule
  SELECT (floor(random()*201)+200)::int AS cnt
) AS counts
CROSS JOIN generate_series(1, counts.cnt) AS g(i);

-- Insert violation records into the violations table to model detected data quality issues.
-- Columns:
--   rule_id: references the violated rule
--   severity: severity level of the violation (copied from rule)
--   table_name: table where violation occurred
--   column_name: column involved in violation
--   offending_value: a random value causing the violation (only for 'open' violations)
--   detected_at: randomized timestamp within last 30 days
--   status: 'open' for active violations, 'closed' for resolved ones
-- This generates 500 violations per rule: first 100 are 'open' with random offending values,
-- remaining 400 are 'closed' with null offending values, simulating a mix of current and historical issues.
INSERT INTO violations (
  rule_id,
  severity,
  table_name,
  column_name,
  offending_value,
  detected_at,
  status
)
SELECT
  cr.id,
  cr.severity AS severity,
  cr.table_name,
  cr.column_name,
  CASE
    WHEN v.i <= 100 THEN (floor(random()*1000))::text
    ELSE NULL
  END AS offending_value,
  NOW() - ((random()*30)||' days')::interval AS detected_at,
  CASE
    WHEN v.i <= 100 THEN 'open'
    ELSE 'closed'
  END AS status
FROM column_rules cr
CROSS JOIN generate_series(1, 500) AS v(i);

-- Insert simulated rule execution runs into the rule_runs table.
-- Columns:
--   rule_id: references the rule executed (randomly chosen)
--   start_time: start timestamp of the run (incremented by 30 minutes per record)
--   end_time: end timestamp, randomized duration added to start_time
--   duration_ms: duration in milliseconds (randomized)
--   checked_rows: number of rows checked (randomized)
--   failed_rows: number of failed rows found (randomized)
--   status: status of the run, fixed to 'completed' here
-- This simulates 20 recent runs with realistic timing and result metrics.
INSERT INTO rule_runs (rule_id, start_time, end_time, duration_ms, checked_rows, failed_rows, status)
SELECT (SELECT id FROM column_rules ORDER BY random() LIMIT 1),
       ts,
       ts + (floor(random()*5000 + 1000) || ' milliseconds')::interval,
       (floor(random()*5000 + 1000))::int,
       (floor(random()*1000 + 100))::int,
       (floor(random()*10))::int,
       'completed'
FROM generate_series(1, 20) AS g(i)
CROSS JOIN LATERAL (
  -- Starting from fixed timestamp, increment by 30 minutes for each run
  SELECT '2025-05-12T00:00:00Z'::timestamptz + ((g.i - 1) * INTERVAL '30 minutes') AS ts
) AS t;

COMMIT;
