/*
  # Rename Accessories Category

  1. Changes
    - Rename 'Accessories' category to 'Motorcycle Accessories'
    - Update the description to be more specific
*/

UPDATE categories 
SET 
  name = 'Motorcycle Accessories',
  description = 'Essential accessories and add-ons for motorcycles'
WHERE name = 'Accessories';