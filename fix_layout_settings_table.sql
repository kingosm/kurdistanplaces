-- Comprehensive script to ensure layout_settings exists and has ALL required columns
-- Safe to re-run multiple times (idempotent)

CREATE TABLE IF NOT EXISTS public.layout_settings (
    page_slug text NOT NULL,
    language text NOT NULL,
    breakpoint text NOT NULL,
    element_id text NOT NULL,
    x numeric NOT NULL DEFAULT 0,
    y numeric NOT NULL DEFAULT 0,
    width numeric DEFAULT NULL,
    height numeric DEFAULT NULL,
    font_size numeric DEFAULT NULL,
    
    -- Visibility rule columns
    hide_on_mobile  boolean DEFAULT false,
    hide_on_tablet  boolean DEFAULT false,
    hide_on_desktop boolean DEFAULT false,
    hide_on_languages text[]  DEFAULT '{}',

    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (page_slug, language, breakpoint, element_id)
);

-- Ensure all columns exist individually (in case table existed partially from previous migrations)
DO $$
BEGIN
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS width numeric DEFAULT NULL;
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS height numeric DEFAULT NULL;
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS font_size numeric DEFAULT NULL;
    
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS hide_on_mobile  boolean DEFAULT false;
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS hide_on_tablet  boolean DEFAULT false;
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS hide_on_desktop boolean DEFAULT false;
    ALTER TABLE public.layout_settings ADD COLUMN IF NOT EXISTS hide_on_languages text[]  DEFAULT '{}';
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists, skipping';
END $$;

-- Policies (safe to re-run)
ALTER TABLE public.layout_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.layout_settings;
CREATE POLICY "Public read access" ON public.layout_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write access" ON public.layout_settings;
CREATE POLICY "Admin write access" ON public.layout_settings FOR ALL USING (
  auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_admin')::boolean = true
);
