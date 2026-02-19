-- Add locked column to layout_settings (run in Supabase SQL Editor)
ALTER TABLE public.layout_settings
ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false;
