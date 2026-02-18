-- FIX PROFILES & TRIGGERS
-- 1. Make Profiles Publicly Readable (so we can see names/avatars)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Ensure Profile Exists on Signup (Trigger)
-- This ensures that when a new user signs up, a row is created in 'profiles' automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- We insert 'id' AND 'user_id' with the same value because your table has both.
  INSERT INTO public.profiles (id, user_id, full_name, avatar_url)
  VALUES (new.id, new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill missing profiles for existing users
-- We check if a profile exists with either the same ID OR the same user_id to avoid duplicates.
INSERT INTO public.profiles (id, user_id, full_name)
SELECT id, id, raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = au.id OR p.user_id = au.id
);
