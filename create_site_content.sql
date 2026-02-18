-- ============================================================
-- Kurdistan Places — Site Content CMS Table
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.site_content (
  id         uuid primary key default gen_random_uuid(),
  key        text not null,
  language   text not null check (language in ('en', 'ku', 'ar')),
  value      text not null,
  updated_at timestamptz default now(),
  unique (key, language)
);

-- Enable Row Level Security
alter table public.site_content enable row level security;

-- Anyone can read content (public site)
create policy "Public read site_content"
  on public.site_content
  for select
  using (true);

-- Only super_admin can insert/update/delete
create policy "Admin write site_content"
  on public.site_content
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
-- The table starts empty. Hardcoded translations are the
-- default fallback. Only values you edit get stored here.
-- ============================================================
