/*
  # Add admin role and management tables

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (text)
      - `total` (integer)
      - `created_at` (timestamp)
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `price` (integer)

  2. Security
    - Add admin role to auth.users
    - Enable RLS on new tables
    - Add admin-specific policies
*/

-- Add admin column to auth.users if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_admin' 
    AND table_schema = 'auth'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total integer NOT NULL CHECK (total >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price integer NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create admin policies for products
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ))
  WITH CHECK (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));

-- Create admin policies for categories
CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ))
  WITH CHECK (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));

-- Create admin policies for orders
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));

CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ))
  WITH CHECK (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));

-- Create admin policies for order items
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));

CREATE POLICY "Users can view their own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ))
  WITH CHECK (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));