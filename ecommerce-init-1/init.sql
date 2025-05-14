-- ============================================================================
-- Ecommerce Demo Database Initialization Script
-- ============================================================================
-- This script initializes a demo ecommerce database by:
--   1. Creating tables for customers, products, orders, and order_items.
--   2. Populating the tables with dummy data to simulate a realistic environment.
-- This setup is intended for development, testing, or demonstration purposes.
-- Each section is commented to explain its purpose and logic.
-- ============================================================================

-- 1) Tabellen anlegen
-- ============================================================================
-- 1) Table Creation
-- ============================================================================

-- Table: customers
-- Stores information about each customer.
-- Columns:
--   id: Unique identifier for each customer (auto-incremented).
--   name: Full name of the customer.
--   email: Customer's email address (must be unique).
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

-- Table: products
-- Stores details about products available for sale.
-- Columns:
--   id: Unique identifier for each product (auto-incremented).
--   name: Name of the product.
--   description: Short description of the product.
--   price: Price of the product (up to 8 digits, 2 decimal places).
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(8,2) NOT NULL
);

-- Table: orders
-- Represents customer orders.
-- Columns:
--   id: Unique identifier for each order (auto-incremented).
--   customer_id: References the customer who placed the order.
--   order_date: Timestamp when the order was placed (defaults to current time).
--   status: Status of the order (e.g., 'completed', 'pending').
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  order_date TIMESTAMP NOT NULL DEFAULT now(),
  status TEXT NOT NULL
);

-- Table: order_items
-- Contains line items for each order, specifying which products were bought.
-- Columns:
--   id: Unique identifier for each order item (auto-incremented).
--   order_id: References the order this item belongs to.
--   product_id: References the purchased product.
--   quantity: Number of units of the product in this order item.
--   unit_price: Price per unit of the product at the time of the order.
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(8,2) NOT NULL
);


-- ============================================================================
-- 2) Generate Dummy Data (Total: >100 Rows)
-- ============================================================================

-- Insert 50 customers
-- Purpose: Creates 50 dummy customers with generic names and emails for testing.
-- Each customer gets a name like 'Customer 1', 'Customer 2', ..., and a unique email.
INSERT INTO customers (name, email)
SELECT
  'Customer '||i,
  'customer'||i||'@example.com'
FROM generate_series(1,50) AS t(i);

-- Insert 50 products
-- Purpose: Populates the products table with 50 sample products.
-- Each product has a name, a description, and a randomly generated price between 1.00 and 101.00.
-- The price is generated using: random()*100 + 1, rounded to 2 decimal places.
-- This simulates a realistic range of product prices.
INSERT INTO products (name, description, price)
SELECT
  'Product '||i,
  'Description for product '||i,
  round((random()*100 + 1)::numeric, 2)
FROM generate_series(1,50) AS t(i);

-- Insert 30 orders
-- Purpose: Creates 30 orders, each linked to a random customer.
--   - customer_id: Randomly selects a customer (IDs 1 to 50).
--   - order_date: Sets the order date to a random number of days (0–30) before now.
--   - status: 80% of orders are marked 'completed', 20% as 'pending'.
--     This is controlled by: CASE WHEN random() < 0.8 THEN 'completed' ELSE 'pending' END
--     This randomization simulates a realistic mix of order statuses.
INSERT INTO orders (customer_id, order_date, status)
SELECT
  (random()*49 + 1)::INT,
  now() - ((random()*30)||' days')::INTERVAL,
  CASE WHEN random() < 0.8 THEN 'completed' ELSE 'pending' END
FROM generate_series(1,30) AS t(i);

-- Insert 100 order_items
-- Purpose: Adds 100 order items, each linking an order and a product.
--   - order_id: Randomly selects an order (IDs 1 to 30).
--   - product_id: Randomly selects a product (IDs 1 to 50).
--   - quantity: Randomly selects a quantity between 1 and 5.
--   - unit_price: Assigns a random product's price from the products table.
--     This simulates varying prices for each order item.
-- The random selection ensures a diverse and realistic set of order line items.
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
  (random()*29 + 1)::INT,
  (random()*49 + 1)::INT,
  (random()*4 + 1)::INT,
  (SELECT price FROM products ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1,100) AS t(i);
