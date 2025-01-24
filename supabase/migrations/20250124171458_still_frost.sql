/*
  # Fix User Panel Permissions

  1. Changes
    - Fix user profile creation trigger
    - Add missing RLS policies for orders and tracking
    - Fix references to auth.users table
  
  2. Security
    - Update RLS policies to use auth.uid() consistently
    - Ensure proper access control for all tables
*/

-- Create trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix order tracking policies
DROP POLICY IF EXISTS "Users can view own order tracking" ON order_tracking;
CREATE POLICY "Users can view own order tracking"
  ON order_tracking FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_tracking.order_id
    AND orders.user_id = auth.uid()
  ));

-- Ensure all existing users have a profile
INSERT INTO public.user_profiles (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT DO NOTHING;