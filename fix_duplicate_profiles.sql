-- FIX DUPLICATE/MISMATCHED PROFILES
-- The Issue: You have a profile where 'user_id' is correct, but the main 'id' is wrong.
-- This confuses the system: keys don't match, but we can't create a new one because 'user_id' is taken.

-- 1. Delete profiles that have the correct user_id but the WRONG main id
DELETE FROM profiles
WHERE user_id IN (SELECT id FROM auth.users)
AND id != user_id;

-- 2. Delete profiles that have the correct main id but the WRONG user_id (rare, but good to clean)
DELETE FROM profiles
WHERE id IN (SELECT id FROM auth.users)
AND id != user_id;

-- 3. Now that the "bad" rows are gone, recreate the correct ones.
-- This insert enforces id = user_id
INSERT INTO public.profiles (id, user_id, full_name, avatar_url)
SELECT 
    id, 
    id, -- FORCE match
    raw_user_meta_data->>'full_name', 
    raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
