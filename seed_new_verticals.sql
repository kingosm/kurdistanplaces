-- Seed New Verticals for Nearby Page
-- Run this in your Supabase SQL Editor

INSERT INTO categories (name, slug, category_type, parent_id, image_url)
VALUES
('Mechanics', 'mechanics', 'vertical', NULL, 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800'),
('Mobile Shops', 'mobile-shops', 'vertical', NULL, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'),
('Candy Shop', 'candy-shop', 'vertical', NULL, 'https://images.unsplash.com/photo-1621939514649-28b5fe2f30ae?w=800')
ON CONFLICT (slug) DO NOTHING;

-- Note: Restaurants and Markets already exist in previous seeds.
