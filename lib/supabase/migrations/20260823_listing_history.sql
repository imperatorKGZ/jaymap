begin;

-- ============================================================
-- JAYMAP — LISTING VIEW HISTORY
-- ============================================================
--
-- История последних просмотренных объявлений
-- авторизованным пользователем.
--
-- Правила:
-- 1. Один user + один listing = одна запись.
-- 2. Повторный просмотр обновляет viewed_at.
-- 3. Храним не более 30 дней.
-- 4. Храним не более 100 последних записей пользователя.
-- 5. Гости историю не создают.
-- ============================================================

create table if not exists public.listing_views (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  listing_id uuid not null
    references public.listings(id)
    on delete cascade,

  viewed_at timestamptz not null
    default now(),

  primary key (
    user_id,
    listing_id
  )
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists
  listing_views_user_viewed_idx
on public.listing_views (
  user_id,
  viewed_at desc
);

create index if not exists
  listing_views_listing_idx
on public.listing_views (
  listing_id
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.listing_views
  enable row level security;

drop policy if exists
  "listing_views_select_own"
on public.listing_views;

create policy
  "listing_views_select_own"
on public.listing_views
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists
  "listing_views_insert_own"
on public.listing_views;

create policy
  "listing_views_insert_own"
on public.listing_views
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists
  "listing_views_update_own"
on public.listing_views;

create policy
  "listing_views_update_own"
on public.listing_views
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

drop policy if exists
  "listing_views_delete_own"
on public.listing_views;

create policy
  "listing_views_delete_own"
on public.listing_views
for delete
to authenticated
using (
  auth.uid() = user_id
);

-- ============================================================
-- RECORD LISTING VIEW
-- ============================================================
--
-- Единая DB-точка записи просмотра.
--
-- Почему RPC:
-- - не доверяем client-side user_id;
-- - auth.uid() берётся непосредственно из Supabase;
-- - cleanup выполняется атомарно;
-- - клиенту не нужно реализовывать pruning.
-- ============================================================

create or replace function
public.record_listing_view(
  p_listing_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  v_user_id :=
    auth.uid();

  if v_user_id is null then
    raise exception
      'Unauthorized';
  end if;

  /*
   * Записываем только существующее
   * активное объявление.
   */
  if not exists (
    select 1
    from public.listings l
    where l.id =
      p_listing_id
      and l.is_active = true
  ) then
    return;
  end if;

  /*
   * Один user + listing = одна строка.
   *
   * Повторный просмотр обновляет viewed_at.
   */
  insert into public.listing_views (
    user_id,
    listing_id,
    viewed_at
  )
  values (
    v_user_id,
    p_listing_id,
    now()
  )
  on conflict (
    user_id,
    listing_id
  )
  do update
    set viewed_at =
      excluded.viewed_at;

  /*
   * Удаляем всё старше 30 дней
   * для текущего пользователя.
   */
  delete from public.listing_views
  where user_id =
    v_user_id
    and viewed_at <
      now() - interval '30 days';

  /*
   * Оставляем максимум
   * 100 последних просмотров.
   */
  delete from public.listing_views lv
  where lv.user_id =
    v_user_id
    and lv.listing_id in (
      select old_views.listing_id
      from public.listing_views old_views
      where old_views.user_id =
        v_user_id

      order by
        old_views.viewed_at desc

      offset 100
    );
end;
$$;

revoke all
  on function public.record_listing_view(uuid)
from public;

grant execute
  on function public.record_listing_view(uuid)
to authenticated;

-- ============================================================
-- GET MY LISTING HISTORY
-- ============================================================
--
-- Возвращаем:
-- - данные для компактного списка;
-- - координаты для flyTo;
-- - данные для существующего ListingPopup.
--
-- Контакты НЕ возвращаем.
--
-- Дополнительно фильтруем 30 дней,
-- чтобы старые данные никогда не попадали
-- в UI даже до очередного cleanup.
-- ============================================================

create or replace function
public.get_my_listing_history()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',
        l.id,

        'title',
        l.title,

        'price',
        l.price,

        'currency',
        l.currency,

        'address',
        l.address,

        'photos',
        l.photos,

        'description',
        l.description,

        'rooms',
        l.rooms,

        'area',
        l.area,

        'floor',
        l.floor,

        'total_floors',
        l.total_floors,

        'furnished',
        l.furnished,

        'parking',
        l.parking,

        'pets',
        l.pets,

        'coordinates',
        jsonb_build_array(
          ST_X(
            l.coordinates::geometry
          ),
          ST_Y(
            l.coordinates::geometry
          )
        ),

        'viewed_at',
        lv.viewed_at
      )
      order by
        lv.viewed_at desc
    ),
    '[]'::jsonb
  )
  from public.listing_views lv

  inner join public.listings l
    on l.id =
      lv.listing_id

  where lv.user_id =
    auth.uid()

    and l.is_active =
      true

    and lv.viewed_at >=
      now() - interval '30 days'

  limit 100;
$$;

revoke all
  on function public.get_my_listing_history()
from public;

grant execute
  on function public.get_my_listing_history()
to authenticated;

commit;