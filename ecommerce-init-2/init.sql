-- This SQL script sets up the initial database schema and populates it with sample data for a simple e-commerce system.
-- It creates tables to store clients, items, purchases, and purchase line items.
-- Additionally, it inserts dummy data to simulate a realistic dataset for testing and development purposes.

-- 1) Create tables with new names

-- Table 'clients' stores information about customers.
-- Columns:
--   client_id: Unique identifier for each client (auto-incremented).
--   full_name: The full name of the client.
--   contact_email: The client's unique email address used for contact.
CREATE TABLE clients (
  client_id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE
);

-- Table 'items' holds details about products available for purchase.
-- Columns:
--   item_id: Unique identifier for each item (auto-incremented).
--   title: The name/title of the item.
--   details: Additional descriptive information about the item.
--   cost_per_unit: The price per single unit of the item (numeric with two decimal places).
CREATE TABLE items (
  item_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  details TEXT,
  cost_per_unit NUMERIC(8,2) NOT NULL
);

-- Table 'purchases' records individual purchase transactions made by clients.
-- Columns:
--   purchase_id: Unique identifier for each purchase (auto-incremented).
--   client_id: References the client who made the purchase (foreign key to clients).
--   purchased_at: Timestamp of when the purchase was made, defaults to current time.
--   purchase_status: Status of the purchase (e.g., shipped, processing, cancelled).
CREATE TABLE purchases (
  purchase_id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES clients(client_id),
  purchased_at TIMESTAMP NOT NULL DEFAULT now(),
  purchase_status TEXT NOT NULL
);

-- Table 'purchase_lines' details the individual items within a purchase.
-- Columns:
--   line_id: Unique identifier for each purchase line (auto-incremented).
--   purchase_id: References the purchase this line belongs to (foreign key to purchases).
--   item_id: References the item being purchased (foreign key to items).
--   count: Quantity of the item purchased.
--   price_each: Price per unit at the time of purchase.
CREATE TABLE purchase_lines (
  line_id SERIAL PRIMARY KEY,
  purchase_id INT NOT NULL REFERENCES purchases(purchase_id),
  item_id INT NOT NULL REFERENCES items(item_id),
  count INT NOT NULL,
  price_each NUMERIC(8,2) NOT NULL
);

-- 2) Generate dummy data (total >120 rows)

-- Insert 40 dummy clients into the 'clients' table.
-- Each client has a unique full name and email address generated using a series from 1 to 40.
-- This simulates a moderate client base for testing.
INSERT INTO clients (full_name, contact_email)
SELECT
  'Client_' || i,
  'client_' || i || '@example.org'
FROM generate_series(1,40) AS t(i);

-- Insert 60 dummy items into the 'items' table.
-- Each item has a title and details string with the item number.
-- The cost_per_unit is randomly generated between 5 and 205, rounded to two decimals.
-- This creates a diverse product catalog for testing.
INSERT INTO items (title, details, cost_per_unit)
SELECT
  'Item_' || i,
  'Details for item ' || i,
  round((random()*200 + 5)::numeric, 2)
FROM generate_series(1,60) AS t(i);

-- Insert 25 dummy purchases into the 'purchases' table.
-- Each purchase is assigned a random client_id between 1 and 40.
-- The purchased_at timestamp is randomly set within the last 15 days.
-- The purchase_status is randomly assigned with 70% chance 'shipped', 20% 'processing', and 10% 'cancelled'.
-- This simulates a realistic set of recent purchase transactions.
INSERT INTO purchases (client_id, purchased_at, purchase_status)
SELECT
  (random()*39 + 1)::INT,
  now() - ((random()*15) || ' days')::INTERVAL,
  CASE WHEN random() < 0.7 THEN 'shipped' WHEN random() < 0.9 THEN 'processing' ELSE 'cancelled' END
FROM generate_series(1,25) AS t(i);

-- Insert 100 dummy purchase lines into the 'purchase_lines' table.
-- Each line is linked to a random purchase_id (1 to 25) and a random item_id (1 to 60).
-- The count of items per line is a random integer between 1 and 5.
-- The price_each is selected randomly from the existing items' cost_per_unit values.
-- This creates a detailed breakdown of items within purchases for testing.
INSERT INTO purchase_lines (purchase_id, item_id, count, price_each)
SELECT
  (random()*24 + 1)::INT,
  (random()*59 + 1)::INT,
  (floor(random()*5)+1)::INT,
  (SELECT cost_per_unit FROM items ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1,100) AS t(i);
