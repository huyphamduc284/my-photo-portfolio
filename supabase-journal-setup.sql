-- Journal tables for the existing archive.
-- Does not modify public.photos except via foreign keys.
-- Run this in the Supabase SQL Editor.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.journal_entries (
  id bigint generated always as identity primary key,
  title text not null,
  slug text not null unique,
  date date not null,
  location text,
  excerpt text,
  body text,
  cover_photo_id bigint references public.photos(id) on delete set null,
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entry_photos (
  id bigint generated always as identity primary key,
  journal_entry_id bigint not null references public.journal_entries(id) on delete cascade,
  photo_id bigint not null references public.photos(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (journal_entry_id, photo_id)
);

create index if not exists journal_entries_date_idx on public.journal_entries (date desc);
create index if not exists journal_entries_published_idx on public.journal_entries (published);
create index if not exists journal_entries_featured_idx on public.journal_entries (featured);
create index if not exists journal_entry_photos_entry_idx on public.journal_entry_photos (journal_entry_id);
create index if not exists journal_entry_photos_position_idx on public.journal_entry_photos (journal_entry_id, position);

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
before update on public.journal_entries
for each row
execute procedure public.set_updated_at();

alter table public.journal_entries enable row level security;
alter table public.journal_entry_photos enable row level security;

drop policy if exists "public can read published journal entries" on public.journal_entries;
create policy "public can read published journal entries"
on public.journal_entries
for select
to anon
using (published = true);

drop policy if exists "authenticated can read journal entries" on public.journal_entries;
create policy "authenticated can read journal entries"
on public.journal_entries
for select
to authenticated
using (true);

drop policy if exists "authenticated can insert journal entries" on public.journal_entries;
create policy "authenticated can insert journal entries"
on public.journal_entries
for insert
to authenticated
with check (true);

drop policy if exists "authenticated can update journal entries" on public.journal_entries;
create policy "authenticated can update journal entries"
on public.journal_entries
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can delete journal entries" on public.journal_entries;
create policy "authenticated can delete journal entries"
on public.journal_entries
for delete
to authenticated
using (true);

drop policy if exists "public can read published journal photos" on public.journal_entry_photos;
create policy "public can read published journal photos"
on public.journal_entry_photos
for select
to anon
using (
  exists (
    select 1
    from public.journal_entries e
    where e.id = journal_entry_id
      and e.published = true
  )
);

drop policy if exists "authenticated can read journal photos" on public.journal_entry_photos;
create policy "authenticated can read journal photos"
on public.journal_entry_photos
for select
to authenticated
using (true);

drop policy if exists "authenticated can insert journal photos" on public.journal_entry_photos;
create policy "authenticated can insert journal photos"
on public.journal_entry_photos
for insert
to authenticated
with check (true);

drop policy if exists "authenticated can update journal photos" on public.journal_entry_photos;
create policy "authenticated can update journal photos"
on public.journal_entry_photos
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated can delete journal photos" on public.journal_entry_photos;
create policy "authenticated can delete journal photos"
on public.journal_entry_photos
for delete
to authenticated
using (true);
