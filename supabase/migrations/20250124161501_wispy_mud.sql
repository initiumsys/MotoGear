/*
  # Add motorcycle accessories and consumables

  1. New Products
    - Added 15 new products across existing categories:
      - Lighting: LED headlights, turn signals, auxiliary lights
      - Audio: Bluetooth headsets, speakers, microphones
      - Protection: Helmets, jackets, gloves
    
  2. Changes
    - Added products with realistic prices and descriptions
    - Ensured stock levels are reasonable
    - Used high-quality Unsplash images
    - Properly linked products to existing category IDs
*/

-- Add new lighting products
INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
('LED Adventure Headlight', 'High-performance LED headlight with DRL for adventure motorcycles', 29999, 'https://images.unsplash.com/photo-1614026480418-bd11fdb9fa99?auto=format&fit=crop&q=80&w=1000', 25, 'd1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a'),
('Smart Turn Signals', 'Wireless smart turn signals with automatic cancellation', 15999, 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?auto=format&fit=crop&q=80&w=1000', 40, 'd1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a'),
('Auxiliary Fog Lights', 'Waterproof LED fog lights with aluminum housing', 19999, 'https://images.unsplash.com/photo-1621677398561-9001fae49a73?auto=format&fit=crop&q=80&w=1000', 30, 'd1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a'),
('Brake Light Flasher', 'Programmable brake light flasher for enhanced visibility', 7999, 'https://images.unsplash.com/photo-1614026480418-bd11fdb9fa99?auto=format&fit=crop&q=80&w=1000', 50, 'd1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a'),
('LED Strip Kit', 'Flexible LED strip kit for motorcycle customization', 8999, 'https://images.unsplash.com/photo-1621677398561-9001fae49a73?auto=format&fit=crop&q=80&w=1000', 45, 'd1c3b2a1-e4f5-4a3b-8c7d-6e5f4d3c2b1a');

-- Add new audio products
INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
('Pro Rider Headset', 'Premium Bluetooth motorcycle headset with noise cancellation', 24999, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1000', 35, 'b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d'),
('Helmet Speakers', 'Ultra-thin helmet speakers with crystal clear audio', 12999, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=1000', 40, 'b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d'),
('Bluetooth Intercom', '2-way motorcycle intercom with 1.6km range', 17999, 'https://images.unsplash.com/photo-1563396983906-b3795482a59a?auto=format&fit=crop&q=80&w=1000', 30, 'b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d'),
('Wind-Resistant Mic', 'Professional-grade microphone for clear communication', 5999, 'https://images.unsplash.com/photo-1617465729890-d7d4796f1803?auto=format&fit=crop&q=80&w=1000', 50, 'b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d'),
('Audio Control Module', 'Handlebar-mounted audio control system', 9999, 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&q=80&w=1000', 25, 'b2a1c3d4-f5e6-7b8a-9c0d-1e2f3a4b5c6d');

-- Add new protection products
INSERT INTO products (name, description, price, image_url, stock, category_id) VALUES
('Carbon Fiber Helmet', 'Lightweight carbon fiber helmet with advanced ventilation', 39999, 'https://images.unsplash.com/photo-1591370409347-2fd43b7842da?auto=format&fit=crop&q=80&w=1000', 20, 'e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6'),
('Armored Jacket', 'All-season motorcycle jacket with removable armor', 29999, 'https://images.unsplash.com/photo-1591370409347-2fd43b7842da?auto=format&fit=crop&q=80&w=1000', 30, 'e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6'),
('Racing Gloves', 'Premium leather gloves with knuckle protection', 8999, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1000', 40, 'e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6'),
('Back Protector', 'CE Level 2 back protector with ventilation', 12999, 'https://images.unsplash.com/photo-1591370409347-2fd43b7842da?auto=format&fit=crop&q=80&w=1000', 35, 'e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6'),
('Knee Guards', 'Professional motorcycle knee guards with impact protection', 7999, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1000', 45, 'e5d4c3b2-a1b2-c3d4-e5f6-a1b2c3d4e5f6');