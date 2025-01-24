-- Add billing address type to addresses table
DO $$ 
BEGIN 
  ALTER TABLE addresses 
  DROP CONSTRAINT IF EXISTS addresses_type_check;
  
  ALTER TABLE addresses 
  ADD CONSTRAINT addresses_type_check 
  CHECK (type IN ('shipping', 'billing'));
END $$;

-- Update create_checkout_session function to handle billing address
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

-- Add policy for billing addresses
CREATE POLICY "Users can manage billing addresses"
  ON addresses
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());