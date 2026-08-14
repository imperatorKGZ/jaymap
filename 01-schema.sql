-- ============================================================
-- JayMap Supabase Schema
-- Правильный порядок создания: PostGIS → cities → listings → favorites
-- ============================================================

-- 1. Включаем PostGIS (один раз на проект)
create extension if not exists postgis;

-- 2. Справочник городов (должен быть ДО listings из-за foreign key)
create table cities (
  id text primary key,
  name text not null,
  name_ru text,
  name_ky text,
  coordinates geography(point, 4326) not null,
  population integer,
  rank integer,
  region text,
  min_zoom integer default 5
);

-- Заполняем cities из вашего kg-cities.geojson
-- (через Supabase Dashboard → Table Editor → Import, или через SQL COPY)

-- 3. Основная таблица объявлений
-- Критичные поля вынесены в отдельные колонки для индексации и фильтрации
-- Специфичные поля (building_class, land_use и т.д.) — в params JSONB
create table listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Тип объекта (связь с разделами sidebar)
  type text not null check (type in ('rental','commercial','land','daily')),

  -- Цена
  price integer not null,
  currency text not null default 'KGS',

  -- Критичные фильтруемые поля (отдельные колонки для индексов)
  rooms integer,
  area integer,              -- площадь, м²
  floor integer,
  total_floors integer,
  furnished boolean default false,
  parking boolean default false,
  pets boolean default false,

  -- Назначение (для commercial/land — дублирует type для уточнения)
  purpose text,              -- 'office','retail','warehouse','production','catering','residential','agricultural'

  -- Гео и адрес
  city_id text references cities(id),
  district text,             -- район города
  address text,
  coordinates geography(point, 4326) not null,

  -- Описание
  title text not null,
  description text,

  -- Контакты
  phone text,
  telegram text,
  whatsapp text,

  -- Фото (публичные URL из Supabase Storage)
  photos text[] default '{}',

  -- Автор (RLS)
  user_id uuid references auth.users(id),

  -- Статус
  is_active boolean not null default true,
  is_premium boolean not null default false,

  -- Специфичные параметры в JSONB (для гибкости без миграций)
  params jsonb not null default '{}',

  -- Полнотекстовый поиск (опционально, для поиска по тексту)
  search_vector tsvector generated always as (
    setweight(to_tsvector('russian', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('russian', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('russian', coalesce(address,'')), 'C')
  ) stored
);

-- 4. Избранное
create table favorites (
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

-- 5. Индексы (после создания таблиц)
create index idx_listings_type on listings(type);
create index idx_listings_price on listings(price);
create index idx_listings_rooms on listings(rooms) where rooms is not null;
create index idx_listings_area on listings(area) where area is not null;
create index idx_listings_city on listings(city_id);
create index idx_listings_active on listings(is_active) where is_active = true;
create index idx_listings_premium on listings(is_premium) where is_premium = true;

-- Геоиндекс (критично для bounds-фильтра)
create index idx_listings_geo on listings using gist(coordinates);

-- JSONB-индекс для params
create index idx_listings_params on listings using gin(params);

-- Полнотекстовый поиск
create index idx_listings_search on listings using gin(search_vector);

-- 6. Триггер автообновления updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_updated_at
  before update on listings
  for each row execute function update_updated_at();

-- 7. Функция: GeoJSON с фильтрацией по viewport bounds
-- Использует PostGIS && (bbox overlap) для быстрого отсева по индексу
create or replace function get_listings_geojson(
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
returns jsonb as $$
declare
  result jsonb;
  env geometry;
begin
  -- Собираем bounding box только если переданы координаты
  if p_west is not null and p_south is not null and p_east is not null and p_north is not null then
    env := ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326);
  end if;

  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(jsonb_agg(
      jsonb_build_object(
        'type', 'Feature',
        'geometry', jsonb_build_object(
          'type', 'Point',
          'coordinates', jsonb_build_array(
            st_x(coordinates::geometry),
            st_y(coordinates::geometry)
          )
        ),
        'properties', jsonb_build_object(
          'id', id,
          'type', type,
          'price', price,
          'currency', currency,
          'rooms', rooms,
          'area', area,
          'floor', floor,
          'furnished', furnished,
          'parking', parking,
          'pets', pets,
          'title', title,
          'address', address,
          'photos', photos,
          'params', params,
          'is_premium', is_premium,
          'created_at', created_at
        )
      )
      order by is_premium desc, created_at desc
    ), '[]'::jsonb)
  )
  into result
  from listings
  where is_active = true
    -- Фильтр по видимой области карты (самый важный для производительности)
    and (env is null or coordinates::geometry && env)
    -- Остальные фильтры
    and (p_type is null or type = p_type)
    and (p_city_id is null or city_id = p_city_id)
    and (p_price_min is null or price >= p_price_min)
    and (p_price_max is null or price <= p_price_max)
    and (p_rooms is null or rooms = p_rooms)
    and (p_area_min is null or area >= p_area_min)
    and (p_area_max is null or area <= p_area_max)
    and (p_furnished is null or furnished = p_furnished)
    and (p_parking is null or parking = p_parking)
    and (p_pets is null or pets = p_pets)
    and (p_params is null or params @> p_params);

  return result;
end;
$$ language plpgsql stable;

-- 8. RLS — безопасность на уровне строк
alter table listings enable row level security;
alter table favorites enable row level security;

-- Читать активные объявления может любой (даже без авторизации)
create policy "listings_select_public"
  on listings for select
  using (is_active = true);

-- Создавать может только авторизованный (проверка в приложении)
create policy "listings_insert_own"
  on listings for insert
  with check (auth.uid() = user_id);

-- Редактировать/удалять только свои
create policy "listings_update_own"
  on listings for update
  using (auth.uid() = user_id);

create policy "listings_delete_own"
  on listings for delete
  using (auth.uid() = user_id);

-- Избранное — только свои записи
create policy "favorites_select_own"
  on favorites for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on favorites for delete
  using (auth.uid() = user_id);

-- 9. Storage bucket для фото (выполнить в Supabase Dashboard или через SQL)
-- Dashboard → Storage → New bucket → "listing-photos", Public: true
-- Затем Policies → Allow public read, authenticated upload
