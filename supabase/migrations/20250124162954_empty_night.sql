/*
  # Remove non-motorcycle related products

  1. Changes
    - Remove products that are not related to motorcycles
    - Keep all motorcycle-specific categories and their products
*/

-- Delete non-motorcycle products
DELETE FROM products 
WHERE name IN (
  'Modern Desk Lamp',
  'Wireless Headphones',
  'Smart Watch'
);