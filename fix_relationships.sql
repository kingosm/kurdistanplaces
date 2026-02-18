-- FIX RELATIONSHIPS
-- This script explicitly defines the Foreign Keys so Supabase knows how tables are connected.

-- 1. Link reviews -> restaurants
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_restaurant_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES restaurants(id)
ON DELETE CASCADE;

-- 2. Link reviews -> profiles (user_id)
-- Note: referencing auth.users is standard, but for joining 'profiles' we usually join via user_id column manually or matched column.
-- Supabase can infer relationship if FK exists to profiles.id
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_profiles_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_profiles_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 3. Link review_photos -> reviews
ALTER TABLE review_photos
DROP CONSTRAINT IF EXISTS review_photos_review_id_fkey;

ALTER TABLE review_photos
ADD CONSTRAINT review_photos_review_id_fkey
FOREIGN KEY (review_id)
REFERENCES reviews(id)
ON DELETE CASCADE;

-- 4. Verify RLS enables access for public (RE-RUN just in case)
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON reviews;
CREATE POLICY "Public reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public review photos are viewable by everyone" ON review_photos;
CREATE POLICY "Public review photos are viewable by everyone" ON review_photos FOR SELECT USING (true);
