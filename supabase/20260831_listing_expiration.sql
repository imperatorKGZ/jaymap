begin;

-- ============================================================
-- JayMap — Listing expiration
-- 2026-08-31
--
-- Правило:
-- опубликованное объявление действует 3 месяца.
--
-- Для новых публикаций:
--   published_at = момент публикации
--   expires_at   = published_at + 3 months
--
-- Для текущих тестовых опубликованных объявлений:
--   срок начинается с момента применения этой миграции.
--
-- ВАЖНО:
-- - физически объявления не удаляются;
-- - существующий lifecycle не меняется;
-- - status остаётся источником истины;
-- - is_active продолжает управляться существующим trigger;
-- - realtor/admin пока не получают отдельной логики;
-- ============================================================


-- ============================================================
-- 1. Добавляем даты публикации и окончания срока
-- ============================================================

alter table public.listings
  add column if not exists published_at timestamptz;

alter table public.listings
  add column if not exists expires_at timestamptz;


-- ============================================================
-- 2. Индекс для проверки срока действия
-- ============================================================

create index if not exists
  idx_listings_expires_at
on public.listings(expires_at);


-- ============================================================
-- 3. Текущие тестовые опубликованные объявления
--
-- Они существуют сейчас и считаются опубликованными.
-- Для них начинаем 3-месячный срок с момента миграции.
-- ============================================================

update public.listings
set
  published_at = now(),
  expires_at = now() + interval '3 months'
where status = 'published';


-- ============================================================
-- 4. Автоматически устанавливаем срок при публикации
-- ============================================================

create or replace function public.set_listing_expiration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- ----------------------------------------------------------
  -- Новое объявление сразу публикуется.
  -- ----------------------------------------------------------

  if tg_op = 'INSERT'
     and new.status = 'published'
  then

    new.published_at = now();

    new.expires_at =
      now() + interval '3 months';

    return new;
  end if;


  -- ----------------------------------------------------------
  -- Существующее объявление переводят:
  --
  -- draft / paused / archived
  --          ↓
  --      published
  --
  -- Начинаем новый срок с момента повторной публикации.
  -- ----------------------------------------------------------

  if tg_op = 'UPDATE'
     and old.status is distinct from 'published'
     and new.status = 'published'
  then

    new.published_at = now();

    new.expires_at =
      now() + interval '3 months';

    return new;
  end if;


  -- ----------------------------------------------------------
  -- Пока объявление остаётся published,
  -- пользователь не может самостоятельно менять срок.
  -- ----------------------------------------------------------

  if tg_op = 'UPDATE'
     and old.status = 'published'
     and new.status = 'published'
  then

    new.published_at =
      old.published_at;

    new.expires_at =
      old.expires_at;

  end if;


  return new;
end;
$$;


-- ============================================================
-- 5. Trigger срока действия
-- ============================================================

drop trigger if exists
  listings_set_expiration
on public.listings;

create trigger
  listings_set_expiration
before insert or update of status
on public.listings
for each row
execute function
  public.set_listing_expiration();


-- ============================================================
-- 6. Публичная карта
--
-- Просроченные объявления не выдаются.
-- ============================================================

create or replace function public.get_listings_geojson(
  p_west double precision default null,
  p_south double precision default null,
  p_east double precision default null,
  p_north double precision default null,
  p_type text default null,
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
    'type',
    'FeatureCollection',

    'features',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'type',
          'Feature',

          'geometry',
          jsonb_build_object(
            'type',
            'Point',

            'coordinates',
            jsonb_build_array(
              ST_X(
                coordinates::geometry
              ),
              ST_Y(
                coordinates::geometry
              )
            )
          ),

          'properties',
          jsonb_build_object(
            'id',
            id,

            'type',
            type,

            'price',
            price,

            'currency',
            currency,

            'rooms',
            rooms,

            'area',
            area,

            'floor',
            floor,

            'total_floors',
            total_floors,

            'furnished',
            furnished,

            'parking',
            parking,

            'pets',
            pets,

            'title',
            title,

            'address',
            address,

            'photos',
            photos,

            'params',
            params,

            'is_premium',
            is_premium,

            'created_at',
            created_at
          )
        )
        order by
          is_premium desc,
          created_at desc
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.listings
  where status = 'published'
    and is_active = true

    and (
      expires_at is null
      or expires_at > now()
    )

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


-- ============================================================
-- 7. Публичная карточка
--
-- Просроченные объявления не возвращаются.
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
      when l.id is null
        then null

      else jsonb_build_object(
        'id',
        l.id,

        'type',
        l.type,

        'price',
        l.price,

        'currency',
        l.currency,

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

        'purpose',
        l.purpose,

        'city_id',
        l.city_id,

        'district',
        l.district,

        'address',
        l.address,

        'title',
        l.title,

        'description',
        l.description,

        'photos',
        l.photos,

        'params',
        l.params,

        'is_premium',
        l.is_premium,

        'created_at',
        l.created_at,

        'updated_at',
        l.updated_at
      )
    end

  from public.listings l

  where l.id = p_listing_id
    and l.status = 'published'
    and l.is_active = true
    and (
      l.expires_at is null
      or l.expires_at > now()
    );
$$;


commit;