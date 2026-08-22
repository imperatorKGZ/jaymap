begin;

-- ============================================================
-- Listing photos bucket
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  array[
    'image/webp',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id)
do update
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/webp',
    'image/jpeg',
    'image/png'
  ];

-- ============================================================
-- INSERT
--
-- Путь:
-- user_id/listing_id/random.webp
--
-- Пользователь может писать
-- только в свою папку.
-- ============================================================

drop policy if exists
  "listing_photos_insert_own"
on storage.objects;

create policy
  "listing_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id =
    'listing-photos'
  and (
    (storage.foldername(name))[1]
      =
    auth.uid()::text
  )
);

-- ============================================================
-- DELETE
-- ============================================================

drop policy if exists
  "listing_photos_delete_own"
on storage.objects;

create policy
  "listing_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id =
    'listing-photos'
  and (
    (storage.foldername(name))[1]
      =
    auth.uid()::text
  )
);

-- ============================================================
-- UPDATE
-- ============================================================

drop policy if exists
  "listing_photos_update_own"
on storage.objects;

create policy
  "listing_photos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id =
    'listing-photos'
  and (
    (storage.foldername(name))[1]
      =
    auth.uid()::text
  )
)
with check (
  bucket_id =
    'listing-photos'
  and (
    (storage.foldername(name))[1]
      =
    auth.uid()::text
  )
);

commit;