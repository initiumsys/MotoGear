/*
  # Add Lubricants subcategory and products

  1. New Categories
    - Add "Lubricants" subcategory under "Motorcycle Accessories"
  
  2. New Products
    - Add motorcycle oils, chain lubricants, and maintenance products
    
  3. Security
    - Inherits existing RLS policies from parent tables
*/

-- Get the Motorcycle Accessories category ID
DO $$
DECLARE
  accessories_id uuid;
BEGIN
  -- Get the parent category ID
  SELECT id INTO accessories_id FROM categories WHERE name = 'Motorcycle Accessories';

  -- Create Lubricants subcategory
  INSERT INTO categories (name, description, parent_id) VALUES
  ('Lubricants', 'High-quality oils and lubricants for motorcycle maintenance', accessories_id);

  -- Get the new Lubricants category ID and insert products
  WITH lubricants_category AS (
    SELECT id FROM categories WHERE name = 'Lubricants'
  )
  INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
  ('Premium Synthetic Oil 10W-40', 'High-performance synthetic engine oil for motorcycles', 5999, 'https://images.unsplash.com/photo-1635335874521-4e7d5c979b38?auto=format&fit=crop&q=80&w=1000', 50, (SELECT id FROM lubricants_category)),
  ('Chain Lubricant Pro', 'Advanced chain lubricant with anti-wear protection', 1999, 'https://images.unsplash.com/photo-1635335874521-4e7d5c979b38?auto=format&fit=crop&q=80&w=1000', 100, (SELECT id FROM lubricants_category)),
  ('Fork Oil Set', 'Premium fork oil kit for smooth suspension performance', 3999, 'https://images.unsplash.com/photo-1635335874521-4e7d5c979b38?auto=format&fit=crop&q=80&w=1000', 30, (SELECT id FROM lubricants_category)),
  ('Brake Fluid DOT 4', 'High-temperature brake fluid for racing and street use', 1499, 'https://images.unsplash.com/photo-1635335874521-4e7d5c979b38?auto=format&fit=crop&q=80&w=1000', 75, (SELECT id FROM lubricants_category)),
  ('Maintenance Kit', 'Complete oil change and maintenance kit', 7999, 'https://images.unsplash.com/photo-1635335874521-4e7d5c979b38?auto=format&fit=crop&q=80&w=1000', 25, (SELECT id FROM lubricants_category));
END $$;