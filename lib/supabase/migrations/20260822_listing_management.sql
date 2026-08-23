begin;

-- ============================================================
-- JayMap — Listing management
-- ============================================================
--
-- 1. status является источником истины.
-- 2. is_active автоматически синхронизируется с status.
-- 3. Публична только published.
-- 4. paused/draft/archived => is_active = false.
--
-- ============================================================


-- ============================================================
-- 1. Гарантируем наличие lifecycle status
-- ============================================================

alter table public.listings
  add column if not exists status text;

update public.listings
set status =
  case
    when is_active = true
      then 'published'
    else 'archived'
  end
where status is null;

alter table public.listings
  alter column status
  set default 'draft';

alter table public.listings
  alter column status
  set not null;

alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (
    status in (
      'draft',
      'published',
      'paused',
      'archived'
    )
  );


-- ============================================================
-- 2. STATUS -> is_active
-- ============================================================

create or replace function public.sync_listing_active_state()
returns trigger
language plpgsql
as $$
begin

  new.is_active =
    case
      when new.status = 'published'
        then true
      else false
    end;

  return new;
end;
$$;


drop trigger if exists
  listings_sync_active_state
on public.listings;


create trigger listings_sync_active_state
before insert or update of status
on public.listings
for each row
execute function public.sync_listing_active_state();


-- ============================================================
-- 3. Нормализуем существующие записи
-- ============================================================

update public.listings
set is_active =
  case
    when status = 'published'
      then true
    else false
  end;


-- ============================================================
-- 4. Индекс владельца + статус
-- ============================================================

create index if not exists
  idx_listings_owner_status
on public.listings(
  user_id,
  status
);


commit;