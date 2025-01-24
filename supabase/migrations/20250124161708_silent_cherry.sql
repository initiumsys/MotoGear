/*
  # Add Motorcycle Accessories Category

  1. New Category
    - Added 'Accessories' category for motorcycle accessories
  
  2. New Products
    - Added various motorcycle accessories like:
      - Tank bags
      - Phone mounts
      - Tool kits
      - Locks
      - Covers
    
  3. Security
    - Inherits existing RLS policies from categories table
*/

-- Insert accessories category
INSERT INTO categories (name, description) VALUES
('Accessories', 'Essential motorcycle accessories and add-ons');

-- Get the new category ID
DO $$
DECLARE
  accessories_id uuid;
BEGIN
  SELECT id INTO accessories_id FROM categories WHERE name = 'Accessories';

  -- Add new accessories products
  INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
  ('Premium Tank Bag', 'Waterproof magnetic tank bag with phone pocket', 13999, 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&q=80&w=1000', 30, accessories_id),
  ('Phone Mount Pro', 'Vibration-dampening aluminum phone mount', 4999, 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&q=80&w=1000', 50, accessories_id),
  ('Comprehensive Tool Kit', 'Complete motorcycle maintenance tool set', 8999, 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=1000', 25, accessories_id),
  ('Heavy-Duty Chain Lock', 'Hardened steel motorcycle security chain', 7999, 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&q=80&w=1000', 40, accessories_id),
  ('All-Weather Cover', 'UV-resistant waterproof motorcycle cover', 5999, 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=1000', 35, accessories_id);
END $$;