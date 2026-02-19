-- Run in Supabase SQL Editor to add visibility columns to layout_settings
-- Safe to re-run (IF NOT EXISTS guards)

ALTER TABLE public.layout_settings
  ADD COLUMN IF NOT EXISTS hide_on_mobile  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_on_tablet  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_on_desktop boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_on_languages text[]  DEFAULT '{}';
