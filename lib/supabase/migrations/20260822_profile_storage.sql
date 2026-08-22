-- ============================================================
-- JayMap — Profile avatars storage
-- ============================================================

begin;

-- Публичный bucket для аватаров профилей.
insert into storage.buckets (
  id,
  name,
  public
)
values (
  'avatars',
  'avatars',
  true
)
on conflict (id) do update
set public = true;

-- ============================================================
-- Storage RLS
-- ============================================================

-- Любой может читать аватары.
-- Публичность bucket уже позволяет получать их по public URL.

-- Пользователь может загрузить файл только в свою папку:
-- avatars/{auth.uid()}/filename.ext
drop policy if exists "avatars_insert_own"
  on storage.objects;

create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Пользователь может обновлять только свои файлы.
drop policy if exists "avatars_update_own"
  on storage.objects;

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Пользователь может удалять только свои файлы.
drop policy if exists "avatars_delete_own"
  on storage.objects;

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;