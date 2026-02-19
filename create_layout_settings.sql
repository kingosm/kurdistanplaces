-- ============================================================
-- Kurdistan Places — Layout Settings Table
-- Stores per-element drag positions per page, language, breakpoint
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.layout_settings (
  id           uuid primary key default gen_random_uuid(),
  page_slug    text not null,
  language     text not null default 'en',
  breakpoint   text not null default 'desktop',  -- 'mobile' | 'desktop'
  element_id   text not null,
  x            float not null default 0,
  y            float not null default 0,
  width        float,    -- null = natural width
  height       float,    -- null = natural height
  updated_at   timestamptz default now(),
  unique (page_slug, language, breakpoint, element_id)
);

alter table public.layout_settings enable row level security;

-- Public can read (needed to apply positions on page load)
create policy "Public read layout_settings"
  on public.layout_settings
  for select
  using (true);

-- Only super_admin can write
create policy "Admin write layout_settings"
  on public.layout_settings
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'super_admin'
    )
  );

-- ============================================================
-- Done! No seed data needed.
-- Default positions (x=0, y=0) are applied in code.
-- Only non-default positions get stored here.
-- ============================================================
