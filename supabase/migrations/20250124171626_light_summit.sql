/*
  # Fix Orders and User Profile Permissions

  1. Changes
    - Drop and recreate all order-related policies
    - Add missing order tracking policies
    - Fix user profile access
  
  2. Security
    - Ensure proper RLS for all tables
    - Fix permission issues with orders and tracking
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order tracking" ON order_tracking;

-- Fix orders table policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Fix order items policies
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));

-- Fix order tracking policies
CREATE POLICY "Users can view own order tracking"
  ON order_tracking FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_tracking.order_id
    AND orders.user_id = auth.uid()
  ));

-- Fix user profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure all users have a profile
INSERT INTO user_profiles (id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;