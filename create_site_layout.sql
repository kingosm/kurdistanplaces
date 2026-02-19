-- ============================================================
-- Kurdistan Places — Site Layout (Section Order) Table
-- Run this in your Supabase SQL Editor
-- ============================================================

create table if not exists public.site_layout (
  page         text not null,
  section_key  text not null,
  sort_order   int  not null default 0,
  updated_at   timestamptz default now(),
  primary key (page, section_key)
);

alter table public.site_layout enable row level security;

-- Anyone can read layout (needed to render the page in correct order)
create policy "Public read site_layout"
  on public.site_layout
  for select
  using (true);

-- Only super_admin can write
create policy "Admin write site_layout"
  on public.site_layout
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
-- Default section order is defined in code. Only custom
-- orders get stored here.
-- ============================================================
