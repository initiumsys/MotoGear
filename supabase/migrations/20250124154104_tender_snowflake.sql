/*
  # Add product categories

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add category_id to products table
    - Add foreign key constraint
    
  3. Security
    - Enable RLS on categories table
    - Add policy for public read access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Add category to products
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" 
  ON categories FOR SELECT 
  TO public 
  USING (true);

-- Insert sample categories
INSERT INTO categories (id, name, description) VALUES
  ('d1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a', 'Lighting', 'Motorcycle lighting solutions'),
  ('b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d', 'Audio', 'Motorcycle audio and communication systems'),
  ('e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'Protection', 'Protective gear and accessories')
ON CONFLICT (name) DO NOTHING;

-- Update existing products with categories
UPDATE products 
SET category_id = 'd1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a'
WHERE name LIKE '%Lamp%' AND category_id IS NULL;

UPDATE products 
SET category_id = 'b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d'
WHERE name LIKE '%Headphones%' AND category_id IS NULL;

UPDATE products 
SET category_id = 'e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6'
WHERE name LIKE '%Watch%' AND category_id IS NULL;