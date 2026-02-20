-- Comprehensive Menu RLS Fix
-- This script ensures menu_items can be managed by both 'admin' and 'super_admin' roles.

-- 1. Ensure RLS is enabled
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
DROP POLICY IF EXISTS "Super admins can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Super admins can do everything on menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.menu_items;
DROP POLICY IF EXISTS "Enable update for admins" ON public.menu_items;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.menu_items;

-- 3. Create public SELECT policy (respects is_visible flag)
-- Everyone can see visible items, admins can see all items.
CREATE POLICY "Menu items select policy" 
ON public.menu_items FOR SELECT 
USING (
  is_visible = true 
  OR 
  (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'super_admin')))
);

-- 4. Create ALL (Insert/Update/Delete) policy for admins
CREATE POLICY "Admins can manage menu items"
ON public.menu_items FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'super_admin'))
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'super_admin'))
);

-- 5. Grant permissions
GRANT ALL ON public.menu_items TO authenticated;
GRANT SELECT ON public.menu_items TO anon;

-- Note: This assumes the is_visible column already exists (added in previous migrations).
-- If it doesn't, uncomment the line below:
-- ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
