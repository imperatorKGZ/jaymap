-- ============================================================
-- JayMap Supabase Schema — CURRENT REMOTE SNAPSHOT
-- Source: live Supabase project (remote_schema.sql, 2026-08-30)
-- This file mirrors the public application schema currently
-- used by JayMap. It intentionally excludes Supabase-managed
-- schemas (auth/storage/etc.) and PostGIS-generated functions.
-- ============================================================

-- Extensions used by the application
create extension if not exists postgis;
create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- 1. Tables
-- ============================================================
create table if not exists cities (
    id text not null,
        name text not null,
        name_ru text,
        name_ky text,
        coordinates geography(point, 4326) not null,
        population integer,
        rank integer,
        region text,
        min_zoom integer default 5
);

create table if not exists listings (
    id uuid default gen_random_uuid() not null,
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        type text not null,
        price integer not null,
        currency text not null default 'KGS',
        rooms integer,
        area integer,
        floor integer,
        total_floors integer,
        furnished boolean default false,
        parking boolean default false,
        pets boolean default false,
        purpose text,
        city_id text,
        district text,
        address text,
        coordinates geography(point, 4326) not null,
        title text not null,
        description text,
        phone text,
        telegram text,
        whatsapp text,
        photos text[] default '{}',
        user_id uuid,
        is_active boolean not null default true,
        is_premium boolean not null default false,
        params jsonb not null default '{}',
        search_vector tsvector generated always as (
          setweight(to_tsvector('russian', coalesce(title,'')), 'A') ||
          setweight(to_tsvector('russian', coalesce(description,'')), 'B') ||
          setweight(to_tsvector('russian', coalesce(address,'')), 'C')
        ) stored,
        status text not null default 'draft',
        constraint listings_status_check check (status in ('draft','published','paused','archived')),
        constraint listings_type_check check (type in ('rental','commercial','land','daily'))
);

create table if not exists profiles (
    id uuid not null,
        display_name text,
        avatar_url text,
        contact_phone text,
        contact_email text,
        bio text,
        role text not null default 'user',
        verification_status text not null default 'unverified',
        onboarding_completed boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint profiles_role_check check (role in ('user','realtor','admin')),
        constraint profiles_verification_status_check check (verification_status in ('unverified','pending','verified','rejected'))
);

create table if not exists favorites (
    user_id uuid not null,
        listing_id uuid not null,
        created_at timestamptz default now()
);

create table if not exists listing_views (
    user_id uuid not null,
        listing_id uuid not null,
        viewed_at timestamptz not null default now()
);

-- Primary keys and foreign keys
alter table only cities add constraint cities_pkey primary key (id);
alter table only listings add constraint listings_pkey primary key (id);
alter table only profiles add constraint profiles_pkey primary key (id);
alter table only favorites add constraint favorites_pkey primary key (user_id, listing_id);
alter table only listing_views add constraint listing_views_pkey primary key (user_id, listing_id);
alter table only favorites add constraint favorites_listing_id_fkey foreign key (listing_id) references listings(id) on delete cascade;
alter table only favorites add constraint favorites_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table only listing_views add constraint listing_views_listing_id_fkey foreign key (listing_id) references listings(id) on delete cascade;
alter table only listing_views add constraint listing_views_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table only listings add constraint listings_city_id_fkey foreign key (city_id) references cities(id);
alter table only listings add constraint listings_user_id_fkey foreign key (user_id) references auth.users(id);
alter table only profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- ============================================================
-- 2. Functions / RPC
-- ============================================================
CREATE OR REPLACE FUNCTION "public"."get_listing_contacts"("p_listing_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
ALTER FUNCTION "public"."get_listing_contacts"("p_listing_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_listings_geojson"("p_west" double precision DEFAULT NULL::double precision, "p_south" double precision DEFAULT NULL::double precision, "p_east" double precision DEFAULT NULL::double precision, "p_north" double precision DEFAULT NULL::double precision, "p_type" "text" DEFAULT NULL::"text", "p_city_id" "text" DEFAULT NULL::"text", "p_price_min" integer DEFAULT NULL::integer, "p_price_max" integer DEFAULT NULL::integer, "p_rooms" integer DEFAULT NULL::integer, "p_area_min" integer DEFAULT NULL::integer, "p_area_max" integer DEFAULT NULL::integer, "p_furnished" boolean DEFAULT NULL::boolean, "p_parking" boolean DEFAULT NULL::boolean, "p_pets" boolean DEFAULT NULL::boolean, "p_params" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
            'params', params,
            'is_premium', is_premium,
            'created_at', created_at
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
ALTER FUNCTION "public"."get_listings_geojson"("p_west" double precision DEFAULT NULL::double precision, "p_south" double precision DEFAULT NULL::double precision, "p_east" double precision DEFAULT NULL::double precision, "p_north" double precision DEFAULT NULL::double precision, "p_type" "text" DEFAULT NULL::"text", "p_city_id" "text" DEFAULT NULL::"text", "p_price_min" integer DEFAULT NULL::integer, "p_price_max" integer DEFAULT NULL::integer, "p_rooms" integer DEFAULT NULL::integer, "p_area_min" integer DEFAULT NULL::integer, "p_area_max" integer DEFAULT NULL::integer, "p_furnished" boolean DEFAULT NULL::boolean, "p_parking" boolean DEFAULT NULL::boolean, "p_pets" boolean DEFAULT NULL::boolean, "p_params" "jsonb" DEFAULT NULL::"jsonb") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_my_favorites"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
ALTER FUNCTION "public"."get_my_favorites"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_my_listing_history"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
ALTER FUNCTION "public"."get_my_listing_history"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_public_listing"("p_listing_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
  select
    case
      when l.id is null
        then null

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
    and l.status = 'published'
    and l.is_active = true;
$$;
ALTER FUNCTION "public"."get_public_listing"("p_listing_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_display_name text;
begin

  /*
   * Имя продолжаем получать из Google metadata.
   */
  v_display_name := coalesce(
    nullif(
      trim(
        new.raw_user_meta_data ->> 'full_name'
      ),
      ''
    ),

    nullif(
      trim(
        new.raw_user_meta_data ->> 'name'
      ),
      ''
    ),

    nullif(
      trim(
        new.raw_user_meta_data ->> 'preferred_username'
      ),
      ''
    )
  );

  /*
   * avatar_url намеренно НЕ берём
   * из Google metadata.
   *
   * Пользовательский avatar появляется
   * только после собственной загрузки
   * через ProfileEditModal.
   */

  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    contact_email,
    onboarding_completed
  )
  values (
    new.id,
    v_display_name,
    null,
    new.email,
    v_display_name is not null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."protect_profile_system_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
ALTER FUNCTION "public"."protect_profile_system_fields"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."record_listing_view"("p_listing_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
ALTER FUNCTION "public"."record_listing_view"("p_listing_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."sync_listing_active_state"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
ALTER FUNCTION "public"."sync_listing_active_state"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;
ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

-- ============================================================
-- 3. Indexes
-- ============================================================
create index favorites_listing_idx on favorites using btree (listing_id);
create index favorites_user_created_idx on favorites using btree (user_id, created_at desc);
create index idx_listings_active on listings using btree (is_active) where is_active = true;
create index idx_listings_area on listings using btree (area) where area is not null;
create index idx_listings_city on listings using btree (city_id);
create index idx_listings_geo on listings using gist (coordinates);
create index idx_listings_owner_status on listings using btree (user_id, status);
create index idx_listings_params on listings using gin (params);
create index idx_listings_premium on listings using btree (is_premium) where is_premium = true;
create index idx_listings_price on listings using btree (price);
create index idx_listings_rooms on listings using btree (rooms) where rooms is not null;
create index idx_listings_search on listings using gin (search_vector);
create index idx_listings_status on listings using btree (status);
create index idx_listings_type on listings using btree (type);
create index idx_profiles_role on profiles using btree (role);
create index idx_profiles_verification_status on profiles using btree (verification_status);
create index listing_views_listing_idx on listing_views using btree (listing_id);
create index listing_views_user_viewed_idx on listing_views using btree (user_id, viewed_at desc);

-- ============================================================
-- 4. Triggers
-- ============================================================
create or replace trigger listings_sync_active_state before insert or update of status on public.listings for each row execute function public.sync_listing_active_state();
create or replace trigger listings_updated_at before update on public.listings for each row execute function public.update_updated_at();
create or replace trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create or replace trigger protect_profile_system_fields before update on public.profiles for each row execute function public.protect_profile_system_fields();

-- ============================================================
-- 5. RLS and policies
-- ============================================================
alter table cities enable row level security;
alter table favorites enable row level security;
alter table listing_views enable row level security;
alter table listings enable row level security;
alter table profiles enable row level security;

create policy "favorites_delete_own" on favorites for delete to authenticated using (auth.uid() = user_id);
create policy "favorites_insert_own" on favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites_select_own" on favorites for select to authenticated using (auth.uid() = user_id);

create policy "listing_views_delete_own" on listing_views for delete to authenticated using (auth.uid() = user_id);
create policy "listing_views_insert_own" on listing_views for insert to authenticated with check (auth.uid() = user_id);
create policy "listing_views_select_own" on listing_views for select to authenticated using (auth.uid() = user_id);
create policy "listing_views_update_own" on listing_views for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "listings_delete_own" on listings for delete to authenticated using (auth.uid() = user_id);
create policy "listings_insert_own" on listings for insert to authenticated with check (auth.uid() = user_id);
create policy "listings_select_own" on listings for select to authenticated using (auth.uid() = user_id);
create policy "listings_update_own" on listings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_select_own" on profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- 6. Grants observed in remote snapshot
-- ============================================================
grant all on table cities to anon;
grant all on table cities to authenticated;
grant all on table cities to service_role;

grant all on table favorites to anon;
grant all on table favorites to authenticated;
grant all on table favorites to service_role;

grant all on table listing_views to anon;
grant all on table listing_views to authenticated;
grant all on table listing_views to service_role;

grant all on table listings to anon;
grant all on table listings to authenticated;
grant all on table listings to service_role;

grant all on table profiles to anon;
grant all on table profiles to authenticated;
grant all on table profiles to service_role;

grant all on function public.get_listing_contacts(uuid) to anon;
grant all on function public.get_listing_contacts(uuid) to authenticated;
grant all on function public.get_listing_contacts(uuid) to service_role;

grant all on function public.get_listings_geojson(
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
) to anon;
grant all on function public.get_listings_geojson(
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
) to authenticated;
grant all on function public.get_listings_geojson(
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
) to service_role;

grant all on function public.get_my_favorites() to anon;
grant all on function public.get_my_favorites() to authenticated;
grant all on function public.get_my_favorites() to service_role;

grant all on function public.get_my_listing_history() to anon;
grant all on function public.get_my_listing_history() to authenticated;
grant all on function public.get_my_listing_history() to service_role;

grant all on function public.get_public_listing(uuid) to anon;
grant all on function public.get_public_listing(uuid) to authenticated;
grant all on function public.get_public_listing(uuid) to service_role;

grant all on function public.record_listing_view(uuid) to anon;
grant all on function public.record_listing_view(uuid) to authenticated;
grant all on function public.record_listing_view(uuid) to service_role;

grant all on function public.handle_new_user() to anon;
grant all on function public.handle_new_user() to authenticated;
grant all on function public.handle_new_user() to service_role;

grant all on function public.protect_profile_system_fields() to anon;
grant all on function public.protect_profile_system_fields() to authenticated;
grant all on function public.protect_profile_system_fields() to service_role;

grant all on function public.sync_listing_active_state() to anon;
grant all on function public.sync_listing_active_state() to authenticated;
grant all on function public.sync_listing_active_state() to service_role;

grant all on function public.update_updated_at() to anon;
grant all on function public.update_updated_at() to authenticated;
grant all on function public.update_updated_at() to service_role;

-- ============================================================
-- Notes
-- ============================================================
-- 1) Supabase-managed auth/storage schemas are not included in this file.
-- 2) The auth.users trigger that invokes public.handle_new_user() is managed in the auth schema.
-- 3) Storage bucket/policies are managed by Supabase Storage and were not represented as public SQL objects here.
-- 4) IMPORTANT: current remote get_listing_contacts() is SECURITY DEFINER and executable by anon.
--    This mirrors the LIVE database exactly; do not change it here without a deliberate security fix.

