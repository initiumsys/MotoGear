/*
  # Add multi-currency support
  
  1. New Tables
    - `currencies`
      - `code` (text, primary key) - Currency code (e.g., EUR, USD)
      - `name` (text) - Currency name
      - `symbol` (text) - Currency symbol
      - `rate` (numeric) - Exchange rate relative to base currency (EUR)
      - `is_base` (boolean) - Identifies the base currency (EUR)
  
  2. Changes
    - Add currency support to products table
    - Convert existing prices to EUR (base currency)
    
  3. Security
    - Enable RLS on currencies table
    - Add policies for currency access
*/

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  code text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  rate numeric NOT NULL DEFAULT 1.0,
  is_base boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add currency column to products if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE products ADD COLUMN currency_code text REFERENCES currencies(code) DEFAULT 'EUR';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policies for currencies
CREATE POLICY "Currencies are viewable by everyone"
  ON currencies FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify currencies"
  ON currencies
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ))
  WITH CHECK (auth.jwt() ->> 'email' IN (
    SELECT email FROM auth.users WHERE is_admin = true
  ));

-- Insert base currencies
INSERT INTO currencies (code, name, symbol, rate, is_base) VALUES
  ('EUR', 'Euro', '€', 1.0, true),
  ('USD', 'US Dollar', '$', 1.08, false),
  ('GBP', 'British Pound', '£', 0.85, false)
ON CONFLICT (code) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Update existing products to use EUR
UPDATE products SET currency_code = 'EUR' WHERE currency_code IS NULL;