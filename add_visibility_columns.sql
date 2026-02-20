-- Add visibility columns to layout_settings table
-- These columns control conditional display of elements based on device or language

ALTER TABLE public.layout_settings
ADD COLUMN IF NOT EXISTS hide_on_mobile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_on_tablet boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_on_desktop boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_on_languages text[] DEFAULT '{}';

-- Grant permissions if needed (though existing policies should cover updates)
-- Checking if RLS policies need update?
-- The existing generic UPDATE policy covers all columns usually.
