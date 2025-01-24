/*
  # Set Euro as default currency
  
  1. Changes
    - Creates currencies table if it doesn't exist
    - Sets Euro as the base currency
    - Adds initial Euro currency data
  
  2. Security
    - Enables RLS on currencies table
    - Adds policy for public read access
*/

-- Create currencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  rate decimal NOT NULL DEFAULT 1.0,
  is_base boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Currencies are viewable by everyone"
  ON currencies FOR SELECT
  TO public
  USING (true);

-- Insert Euro as the base currency if it doesn't exist
INSERT INTO currencies (code, name, symbol, rate, is_base)
VALUES ('EUR', 'Euro', '€', 1.0, true)
ON CONFLICT (code) 
DO UPDATE SET 
  rate = 1.0,
  is_base = true,
  name = 'Euro',
  symbol = '€';

-- Set all other currencies to non-base
UPDATE currencies 
SET is_base = false 
WHERE code != 'EUR';