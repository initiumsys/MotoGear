/*
  # Add checkout functionality

  1. New Tables
    - `checkout_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (text, enum: 'pending', 'completed', 'cancelled')
      - `total_amount` (integer)
      - `shipping_address_id` (uuid, references addresses)
      - `billing_address_id` (uuid, references addresses)
      - `payment_mode` (text, references user_profiles.payment_mode)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)

    - `checkout_items`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references checkout_sessions)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `price_at_time` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create checkout_sessions table
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  shipping_address_id uuid REFERENCES addresses NOT NULL,
  billing_address_id uuid REFERENCES addresses NOT NULL,
  payment_mode text NOT NULL CHECK (payment_mode IN ('prepaid', 'postpaid')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create checkout_items table
CREATE TABLE IF NOT EXISTS checkout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES checkout_sessions NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time integer NOT NULL CHECK (price_at_time >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_items ENABLE ROW LEVEL SECURITY;

-- Create policies for checkout_sessions
CREATE POLICY "Users can view own checkout sessions"
  ON checkout_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own checkout sessions"
  ON checkout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own checkout sessions"
  ON checkout_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for checkout_items
CREATE POLICY "Users can view own checkout items"
  ON checkout_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM checkout_sessions
    WHERE checkout_sessions.id = checkout_items.session_id
    AND checkout_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own checkout items"
  ON checkout_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM checkout_sessions
    WHERE checkout_sessions.id = checkout_items.session_id
    AND checkout_sessions.user_id = auth.uid()
  ));

-- Create function to create checkout session
CREATE OR REPLACE FUNCTION create_checkout_session(
  p_user_id uuid,
  p_shipping_address_id uuid,
  p_billing_address_id uuid,
  p_cart_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
  v_total_amount integer := 0;
  v_payment_mode text;
  v_item jsonb;
BEGIN
  -- Get user's payment mode
  SELECT payment_mode INTO v_payment_mode
  FROM user_profiles
  WHERE id = p_user_id;

  -- Create checkout session
  INSERT INTO checkout_sessions (
    user_id,
    status,
    total_amount,
    shipping_address_id,
    billing_address_id,
    payment_mode,
    expires_at
  ) VALUES (
    p_user_id,
    'pending',
    0, -- Will update this after calculating total
    p_shipping_address_id,
    p_billing_address_id,
    v_payment_mode,
    now() + interval '1 hour'
  ) RETURNING id INTO v_session_id;

  -- Insert checkout items and calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    INSERT INTO checkout_items (
      session_id,
      product_id,
      quantity,
      price_at_time
    ) VALUES (
      v_session_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price')::integer
    );

    v_total_amount := v_total_amount + 
      ((v_item->>'quantity')::integer * (v_item->>'price')::integer);
  END LOOP;

  -- Update total amount
  UPDATE checkout_sessions
  SET total_amount = v_total_amount
  WHERE id = v_session_id;

  RETURN v_session_id;
END;
$$;