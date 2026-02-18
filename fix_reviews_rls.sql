-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access to reviews (so they show up on Profile and Admin)
DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON reviews;
CREATE POLICY "Public reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

-- 2. Allow authenticated users to insert their own reviews
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- 4. Allow users to delete their own reviews
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- 5. Allow super_admin to do everything on reviews
DROP POLICY IF EXISTS "Super admins can do everything on reviews" ON reviews;
CREATE POLICY "Super admins can do everything on reviews" ON reviews FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- REVIEWS PHOTOS
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access to review photos
DROP POLICY IF EXISTS "Public review photos are viewable by everyone" ON review_photos;
CREATE POLICY "Public review photos are viewable by everyone" ON review_photos FOR SELECT USING (true);

-- 2. Allow users to insert photos for their own reviews
DROP POLICY IF EXISTS "Users can insert their own review photos" ON review_photos;
CREATE POLICY "Users can insert their own review photos" ON review_photos FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM reviews
        WHERE id = review_id
        AND user_id = auth.uid()
    )
);

-- 3. Allow users to delete their own review photos
DROP POLICY IF EXISTS "Users can delete their own review photos" ON review_photos;
CREATE POLICY "Users can delete their own review photos" ON review_photos FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM reviews
        WHERE id = review_id
        AND user_id = auth.uid()
    )
);

-- 4. Allow super_admin to do everything on review photos
DROP POLICY IF EXISTS "Super admins can do everything on review photos" ON review_photos;
CREATE POLICY "Super admins can do everything on review photos" ON review_photos FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);
