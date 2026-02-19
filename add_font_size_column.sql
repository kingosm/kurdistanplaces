-- Run in Supabase SQL Editor to add font_size column to layout_settings
-- Safe to re-run (IF NOT EXISTS guard)

ALTER TABLE public.layout_settings
  ADD COLUMN IF NOT EXISTS font_size numeric DEFAULT NULL;
