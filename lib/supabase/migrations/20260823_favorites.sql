begin;

-- ============================================================
-- JAYMAP — FAVORITES
-- ============================================================
--
-- Один пользователь может добавить объявление
-- в избранное только один раз.
--
-- Удаление пользователя / объявления
-- автоматически удаляет favorite.
-- ============================================================

create table if not exists public.favorites (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  listing_id uuid not null
    references public.listings(id)
    on delete cascade,

  created_at timestamptz not null
    default now(),

  primary key (
    user_id,
    listing_id
  )
);

create index if not exists favorites_user_created_idx
  on public.favorites (
    user_id,
    created_at desc
  );

create index if not exists favorites_listing_idx
  on public.favorites (
    listing_id
  );

-- ============================================================
-- RLS
-- ============================================================

alter table public.favorites
  enable row level security;

drop policy if exists
  "favorites_select_own"
on public.favorites;

create policy
  "favorites_select_own"
on public.favorites
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists
  "favorites_insert_own"
on public.favorites;

create policy
  "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists
  "favorites_delete_own"
on public.favorites;

create policy
  "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (
  auth.uid() = user_id
);

-- ============================================================
-- GET MY FAVORITES
-- ============================================================
--
-- Нельзя просто SELECT listings:
-- текущая security foundation специально запрещает
-- прямой public SELECT listings.
--
-- Поэтому используем SECURITY DEFINER RPC.
--
-- Возвращаем:
-- - данные для компактного списка
-- - координаты для flyTo
-- - данные для существующего ListingPopup
--
-- Контакты НЕ возвращаем.
-- ============================================================

create or replace function public.get_my_favorites()
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

        'favorited_at',
        f.created_at
      )
      order by f.created_at desc
    ),
    '[]'::jsonb
  )
  from public.favorites f
  inner join public.listings l
    on l.id = f.listing_id
  where f.user_id = auth.uid()
    and l.is_active = true;
$$;

revoke all
  on function public.get_my_favorites()
from public;

grant execute
  on function public.get_my_favorites()
to authenticated;

commit;