/*
  # Add Tires subcategory and products

  1. New Tables
    - Add parent_id to categories table for subcategories
  
  2. Changes
    - Add parent_id column to categories table
    - Create Tires subcategory under Motorcycle Accessories
    - Add tire products
    
  3. Security
    - Maintain existing RLS policies
*/

-- Add parent_id to categories if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN parent_id uuid REFERENCES categories(id);
  END IF;
END $$;

-- Get the Motorcycle Accessories category ID
DO $$
DECLARE
  accessories_id uuid;
BEGIN
  -- Get the parent category ID
  SELECT id INTO accessories_id FROM categories WHERE name = 'Motorcycle Accessories';

  -- Create Tires subcategory
  INSERT INTO categories (name, description, parent_id) VALUES
  ('Tires', 'High-performance motorcycle tires and accessories', accessories_id);

  -- Get the new Tires category ID and insert products
  WITH tires_category AS (
    SELECT id FROM categories WHERE name = 'Tires'
  )
  INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
  ('Sport Bike Tire Set', 'High-grip sport motorcycle tire set for maximum performance', 39999, 'https://images.unsplash.com/photo-1580397581145-cdb6a35b7d3f?auto=format&fit=crop&q=80&w=1000', 15, (SELECT id FROM tires_category)),
  ('All-Weather Touring Tires', 'All-season touring tires with excellent wet grip', 29999, 'https://images.unsplash.com/photo-1580397581145-cdb6a35b7d3f?auto=format&fit=crop&q=80&w=1000', 20, (SELECT id FROM tires_category)),
  ('Off-Road Adventure Tires', 'Rugged dual-sport tires for on and off-road use', 34999, 'https://images.unsplash.com/photo-1580397581145-cdb6a35b7d3f?auto=format&fit=crop&q=80&w=1000', 12, (SELECT id FROM tires_category)),
  ('Racing Slicks', 'Track-day racing slicks for maximum grip', 44999, 'https://images.unsplash.com/photo-1580397581145-cdb6a35b7d3f?auto=format&fit=crop&q=80&w=1000', 8, (SELECT id FROM tires_category)),
  ('Tire Pressure Monitoring System', 'Wireless TPMS for real-time tire pressure monitoring', 9999, 'https://images.unsplash.com/photo-1580397581145-cdb6a35b7d3f?auto=format&fit=crop&q=80&w=1000', 30, (SELECT id FROM tires_category));
END $$;