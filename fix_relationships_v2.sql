-- FIX ORPHANED DATA & RELATIONSHIPS v2
-- This script cleans up bad data first, then adds the relationships.

-- 1. Delete orphaned reviews (reviews where the user no longer exists in profiles)
-- This fixes the "violates foreign key constraint" error you saw.
DELETE FROM reviews
WHERE user_id NOT IN (SELECT id FROM profiles);

-- 2. Delete orphaned reviews (reviews where the restaurant no longer exists)
DELETE FROM reviews
WHERE restaurant_id NOT IN (SELECT id FROM restaurants);

-- 3. Now we can safely add the Foreign Keys

-- Link reviews -> restaurants
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_restaurant_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_restaurant_id_fkey
FOREIGN KEY (restaurant_id)
REFERENCES restaurants(id)
ON DELETE CASCADE;

-- Link reviews -> profiles
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_profiles_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_profiles_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Link review_photos -> reviews
ALTER TABLE review_photos
DROP CONSTRAINT IF EXISTS review_photos_review_id_fkey;

-- Cleanup orphaned photos before adding constraint
DELETE FROM review_photos
WHERE review_id NOT IN (SELECT id FROM reviews);

ALTER TABLE review_photos
ADD CONSTRAINT review_photos_review_id_fkey
FOREIGN KEY (review_id)
REFERENCES reviews(id)
ON DELETE CASCADE;
