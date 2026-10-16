-- Keep RLS enabled. Public read, authenticated write.
-- Run this in the Supabase SQL editor.

alter table public.photos enable row level security;

drop policy if exists "photos_select_public" on public.photos;
drop policy if exists "public can read photos" on public.photos;
create policy "public can read photos"
on public.photos
for select
to anon, authenticated
using (true);

drop policy if exists "photos_insert_authenticated" on public.photos;
drop policy if exists "authenticated can insert photos" on public.photos;
create policy "authenticated can insert photos"
on public.photos
for insert
to authenticated
with check (true);

drop policy if exists "photos_update_authenticated" on public.photos;
drop policy if exists "authenticated can update photos" on public.photos;
create policy "authenticated can update photos"
on public.photos
for update
to authenticated
using (true)
with check (true);

drop policy if exists "photos_delete_authenticated" on public.photos;
drop policy if exists "authenticated can delete photos" on public.photos;
create policy "authenticated can delete photos"
on public.photos
for delete
to authenticated
using (true);

-- Storage: public read, authenticated write on bucket "photos"

drop policy if exists "photos_storage_select_public" on storage.objects;
drop policy if exists "public can read photo files" on storage.objects;
create policy "public can read photo files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'photos');

drop policy if exists "photos_storage_insert_authenticated" on storage.objects;
drop policy if exists "authenticated can upload photos" on storage.objects;
create policy "authenticated can upload photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'photos');

drop policy if exists "photos_storage_update_authenticated" on storage.objects;
drop policy if exists "authenticated can update photos" on storage.objects;
create policy "authenticated can update photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'photos')
with check (bucket_id = 'photos');

drop policy if exists "photos_storage_delete_authenticated" on storage.objects;
drop policy if exists "authenticated can delete photos" on storage.objects;
create policy "authenticated can delete photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'photos');
