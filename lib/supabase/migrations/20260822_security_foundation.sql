-- ============================================================
-- JayMap — Security Foundation
-- 2026-08-22
--
-- Цели:
-- 1. Убрать прямой public SELECT из listings.
-- 2. Оставить владельцу доступ к своим listings.
-- 3. Сделать GeoJSON RPC SECURITY DEFINER.
-- 4. Создать public listing detail RPC без контактов.
-- 5. Создать authenticated contacts RPC.
-- 6. Запретить пользователю менять role / verification_status.
-- ============================================================

begin;

-- ============================================================
-- 1. LISTINGS RLS
-- ============================================================

alter table public.listings
  enable row level security;

drop policy if exists "listings_select_public"
  on public.listings;

drop policy if exists "listings_select_own"
  on public.listings;

create policy "listings_select_own"
  on public.listings
  for select
  to authenticated
  using (
    auth.uid() = user_id
  );

drop policy if exists "listings_insert_own"
  on public.listings;

create policy "listings_insert_own"
  on public.listings
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
  );

drop policy if exists "listings_update_own"
  on public.listings;

create policy "listings_update_own"
  on public.listings
  for update
  to authenticated
  using (
    auth.uid() = user_id
  )
  with check (
    auth.uid() = user_id
  );

drop policy if exists "listings_delete_own"
  on public.listings;

create policy "listings_delete_own"
  on public.listings
  for delete
  to authenticated
  using (
    auth.uid() = user_id
  );

-- ============================================================
-- 2. PUBLIC MAP RPC
-- ============================================================

create or replace function public.get_listings_geojson(
  p_west  double precision default null,
  p_south double precision default null,
  p_east  double precision default null,
  p_north double precision default null,
  p_type  text default null,
  p_city_id text default null,
  p_price_min integer default null,
  p_price_max integer default null,
  p_rooms integer default null,
  p_area_min integer default null,
  p_area_max integer default null,
  p_furnished boolean default null,
  p_parking boolean default null,
  p_pets boolean default null,
  p_params jsonb default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
  env geometry;
begin

  if p_west is not null
     and p_south is not null
     and p_east is not null
     and p_north is not null
  then
    env := ST_MakeEnvelope(
      p_west,
      p_south,
      p_east,
      p_north,
      4326
    );
  end if;

  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'type', 'Feature',

          'geometry',
          jsonb_build_object(
            'type', 'Point',
            'coordinates',
            jsonb_build_array(
              ST_X(coordinates::geometry),
              ST_Y(coordinates::geometry)
            )
          ),

          'properties',
          jsonb_build_object(
            'id', id,
            'type', type,
            'price', price,
            'currency', currency,
            'rooms', rooms,
            'area', area,
            'floor', floor,
            'total_floors', total_floors,
            'furnished', furnished,
            'parking', parking,
            'pets', pets,
            'title', title,
            'address', address,
            'photos', photos,
            'description', description,
            'params', params,
            'is_premium', is_premium,
            'created_at', created_at
          )
        )
        order by is_premium desc, created_at desc
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.listings
  where is_active = true

    and (
      env is null
      or coordinates::geometry && env
    )

    and (
      p_type is null
      or type = p_type
    )

    and (
      p_city_id is null
      or city_id = p_city_id
    )

    and (
      p_price_min is null
      or price >= p_price_min
    )

    and (
      p_price_max is null
      or price <= p_price_max
    )

    and (
      p_rooms is null
      or rooms = p_rooms
    )

    and (
      p_area_min is null
      or area >= p_area_min
    )

    and (
      p_area_max is null
      or area <= p_area_max
    )

    and (
      p_furnished is null
      or furnished = p_furnished
    )

    and (
      p_parking is null
      or parking = p_parking
    )

    and (
      p_pets is null
      or pets = p_pets
    )

    and (
      p_params is null
      or params @> p_params
    );

  return result;
end;
$$;

grant execute on function public.get_listings_geojson(
  double precision,
  double precision,
  double precision,
  double precision,
  text,
  text,
  integer,
  integer,
  integer,
  integer,
  integer,
  boolean,
  boolean,
  boolean,
  jsonb
)
to anon, authenticated;

-- ============================================================
-- 3. PUBLIC LISTING DETAIL RPC
--
-- Никаких контактов.
-- ============================================================

create or replace function public.get_public_listing(
  p_listing_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    case
      when l.id is null then null
      else jsonb_build_object(
        'id', l.id,
        'type', l.type,
        'price', l.price,
        'currency', l.currency,
        'rooms', l.rooms,
        'area', l.area,
        'floor', l.floor,
        'total_floors', l.total_floors,
        'furnished', l.furnished,
        'parking', l.parking,
        'pets', l.pets,
        'purpose', l.purpose,
        'city_id', l.city_id,
        'district', l.district,
        'address', l.address,
        'title', l.title,
        'description', l.description,
        'photos', l.photos,
        'params', l.params,
        'is_premium', l.is_premium,
        'created_at', l.created_at,
        'updated_at', l.updated_at
      )
    end
  from public.listings l
  where l.id = p_listing_id
    and l.is_active = true;
$$;

grant execute on function public.get_public_listing(uuid)
to anon, authenticated;

-- ============================================================
-- 4. PRIVATE CONTACTS RPC
--
-- Только authenticated.
-- Возвращает контакты активного объявления.
-- ============================================================

create or replace function public.get_listing_contacts(
  p_listing_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    case
      when l.id is null then null
      else jsonb_build_object(
        'phone', l.phone,
        'telegram', l.telegram,
        'whatsapp', l.whatsapp
      )
    end
  from public.listings l
  where l.id = p_listing_id
    and l.is_active = true;
$$;

revoke all
  on function public.get_listing_contacts(uuid)
  from public;

grant execute
  on function public.get_listing_contacts(uuid)
  to authenticated;

-- ============================================================
-- 5. PROFILES — защита role / verification_status
-- ============================================================

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if TG_OP = 'UPDATE' then

    -- ID профиля менять нельзя.
    if new.id <> old.id then
      raise exception
        'Profile id cannot be changed';
    end if;

    -- Обычный пользователь не может менять
    -- системные поля role / verification_status.
    if auth.role() <> 'service_role' then

      if new.role is distinct from old.role then
        raise exception
          'Profile role can only be changed by system administrator';
      end if;

      if new.verification_status
         is distinct from old.verification_status
      then
        raise exception
          'Verification status can only be changed by system administrator';
      end if;

    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_system_fields
  on public.profiles;

create trigger protect_profile_system_fields
  before update
  on public.profiles
  for each row
  execute function public.protect_profile_system_fields();

commit;