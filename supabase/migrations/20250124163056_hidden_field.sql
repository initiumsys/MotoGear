/*
  # Update product images

  1. Changes
    - Update all product images with better quality, motorcycle-specific photos
    - Ensure all images are from Unsplash and are properly formatted
*/

-- Update Lighting category products
UPDATE products 
SET image_url = CASE name
  WHEN 'LED Adventure Headlight' THEN 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Smart Turn Signals' THEN 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Auxiliary Fog Lights' THEN 'https://images.unsplash.com/photo-1558981403-c5f9241f6560?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Brake Light Flasher' THEN 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&q=80&w=1000'
  WHEN 'LED Strip Kit' THEN 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1000'
END
WHERE category_id = (SELECT id FROM categories WHERE name = 'Lighting');

-- Update Audio category products
UPDATE products 
SET image_url = CASE name
  WHEN 'Pro Rider Headset' THEN 'https://images.unsplash.com/photo-1577804627334-0e3314a4776a?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Helmet Speakers' THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Bluetooth Intercom' THEN 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Wind-Resistant Mic' THEN 'https://images.unsplash.com/photo-1590935217281-8f102120d683?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Audio Control Module' THEN 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=1000'
END
WHERE category_id = (SELECT id FROM categories WHERE name = 'Audio');

-- Update Protection category products
UPDATE products 
SET image_url = CASE name
  WHEN 'Carbon Fiber Helmet' THEN 'https://images.unsplash.com/photo-1591370409347-2fd43b7842da?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Armored Jacket' THEN 'https://images.unsplash.com/photo-1591375275624-c2f9cbfa7f2d?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Racing Gloves' THEN 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Back Protector' THEN 'https://images.unsplash.com/photo-1591375275763-fbcd60a9570c?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Knee Guards' THEN 'https://images.unsplash.com/photo-1591375246211-43131d510661?auto=format&fit=crop&q=80&w=1000'
END
WHERE category_id = (SELECT id FROM categories WHERE name = 'Protection');

-- Update Motorcycle Accessories category products
UPDATE products 
SET image_url = CASE name
  WHEN 'Premium Tank Bag' THEN 'https://images.unsplash.com/photo-1558981033-0f0309284409?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Phone Mount Pro' THEN 'https://images.unsplash.com/photo-1558980394-34764db076b4?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Comprehensive Tool Kit' THEN 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Heavy-Duty Chain Lock' THEN 'https://images.unsplash.com/photo-1558981001-792f6c0d5068?auto=format&fit=crop&q=80&w=1000'
  WHEN 'All-Weather Cover' THEN 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1000'
END
WHERE category_id = (SELECT id FROM categories WHERE name = 'Motorcycle Accessories');

-- Update Tires category products
UPDATE products 
SET image_url = CASE name
  WHEN 'Sport Bike Tire Set' THEN 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&q=80&w=1000'
  WHEN 'All-Weather Touring Tires' THEN 'https://images.unsplash.com/photo-1558981033-0f0309284409?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Off-Road Adventure Tires' THEN 'https://images.unsplash.com/photo-1558981403-c5f9241f6560?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Racing Slicks' THEN 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Tire Pressure Monitoring System' THEN 'https://images.unsplash.com/photo-1558981001-792f6c0d5068?auto=format&fit=crop&q=80&w=1000'
END
WHERE category_id = (SELECT id FROM categories WHERE name = 'Tires');

-- Update Lubricants category products
UPDATE products 
SET image_url = CASE name
  WHEN 'Premium Synthetic Oil 10W-40' THEN 'https://images.unsplash.com/photo-1558981001-792f6c0d5068?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Chain Lubricant Pro' THEN 'https://images.unsplash.com/photo-1558981033-0f0309284409?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Fork Oil Set' THEN 'https://images.unsplash.com/photo-1558981403-c5f9241f6560?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Brake Fluid DOT 4' THEN 'https://images.unsplash.com/photo-1558981001-792f6c0d5068?auto=format&fit=crop&q=80&w=1000'
  WHEN 'Maintenance Kit' THEN 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&q=80&w=1000'
END
WHERE category_id = (SELECT id FROM categories WHERE name = 'Lubricants');