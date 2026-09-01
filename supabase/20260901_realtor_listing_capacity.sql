begin;

-- ============================================================
-- JayMap — Realtor listing capacity
-- 2026-09-01
--
-- Правила:
--   user    -> максимум 3 опубликованных объявления
--   realtor -> максимум 10 опубликованных объявлений
--   admin   -> без лимита
--
-- Для риелтора предусмотрены платные дополнительные блоки:
--   +10 объявлений = 300 сом / 30 дней
--
-- Платёжный шлюз пока не подключается.
-- Таблица хранит только уже выданную активную квоту.
-- Выдавать addon из браузера нельзя.
-- ============================================================


-- ============================================================
-- 1. Платные дополнительные блоки для риелторов
-- ============================================================

create table if not exists public.realtor_listing_addons (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  quantity integer not null
    default 10,

  price_som integer not null
    default 300,

  status text not null
    default 'active'
    check (
      status in (
        'active',
        'expired',
        'cancelled'
      )
    ),

  active_until timestamptz not null,

  created_at timestamptz not null
    default now(),

  constraint realtor_listing_addons_quantity_check
    check (
      quantity > 0
      and quantity % 10 = 0
    ),

  constraint realtor_listing_addons_price_check
    check (
      price_som > 0
    )
);


create index if not exists
  realtor_listing_addons_user_active_idx
on public.realtor_listing_addons (
  user_id,
  status,
  active_until
);


alter table public.realtor_listing_addons
  enable row level security;


-- ============================================================
-- 2. Пользователь не может самостоятельно выдавать себе квоту
-- ============================================================

drop policy if exists
  realtor_listing_addons_select_own
on public.realtor_listing_addons;

drop policy if exists
  realtor_listing_addons_insert_own
on public.realtor_listing_addons;

drop policy if exists
  realtor_listing_addons_update_own
on public.realtor_listing_addons;

drop policy if exists
  realtor_listing_addons_delete_own
on public.realtor_listing_addons;


-- ============================================================
-- 3. RPC: текущая квота пользователя
-- ============================================================

drop function if exists
  public.get_my_listing_capacity();


create or replace function public.get_my_listing_capacity()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  current_user_id uuid;
  owner_role text;
  base_limit integer;
  extra_limit integer;
  published_count integer;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required';
  end if;

  select p.role
    into owner_role
  from public.profiles p
  where p.id = current_user_id;

  if owner_role is null then
    raise exception using
      errcode = '42501',
      message = 'Profile not found';
  end if;

  if owner_role = 'admin' then
    base_limit := null;
  elsif owner_role = 'realtor' then
    base_limit := 10;
  else
    base_limit := 3;
  end if;

  select count(*)::integer
    into published_count
  from public.listings l
  where l.user_id = current_user_id
    and l.status = 'published';

  if owner_role = 'realtor' then
    select coalesce(
      sum(a.quantity),
      0
    )::integer
      into extra_limit
    from public.realtor_listing_addons a
    where a.user_id = current_user_id
      and a.status = 'active'
      and a.active_until > now();
  else
    extra_limit := 0;
  end if;

  return jsonb_build_object(
    'role', owner_role,
    'base_limit', base_limit,
    'extra_limit', extra_limit,
    'total_limit',
      case
        when base_limit is null then null
        else base_limit + extra_limit
      end,
    'published_count', published_count,
    'remaining',
      case
        when base_limit is null then null
        else greatest(
          (base_limit + extra_limit)
          - published_count,
          0
        )
      end
  );
end;
$$;


revoke all
  on function public.get_my_listing_capacity()
  from public;

grant execute
  on function public.get_my_listing_capacity()
  to authenticated;


-- ============================================================
-- 4. Единственный источник истины для публикации
-- ============================================================

create or replace function public.enforce_regular_user_listing_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_role text;
  published_count integer;
  base_limit integer;
  extra_limit integer := 0;
  total_limit integer;
begin
  -- ----------------------------------------------------------
  -- INSERT
  -- ----------------------------------------------------------
  if tg_op = 'INSERT' then

    if new.status <> 'published' then
      return new;
    end if;

  -- ----------------------------------------------------------
  -- UPDATE
  -- ----------------------------------------------------------
  elsif tg_op = 'UPDATE' then

    if old.status = 'published'
       or new.status <> 'published'
    then
      return new;
    end if;

  end if;


  -- ----------------------------------------------------------
  -- Роль владельца
  -- ----------------------------------------------------------

  select p.role
    into owner_role
  from public.profiles p
  where p.id = new.user_id;


  -- Admin не ограничиваем.
  if owner_role = 'admin' then
    return new;
  end if;


  -- Неизвестная роль — не публикуем через это правило.
  if owner_role is null then
    raise exception
      using
        errcode = '42501',
        message = 'Profile role is required before publishing a listing.';
  end if;


  if owner_role = 'realtor' then
    base_limit := 10;

    select coalesce(
      sum(a.quantity),
      0
    )::integer
      into extra_limit
    from public.realtor_listing_addons a
    where a.user_id = new.user_id
      and a.status = 'active'
      and a.active_until > now();

  elsif owner_role = 'user' then
    base_limit := 3;
    extra_limit := 0;

  else
    return new;
  end if;


  total_limit :=
    base_limit +
    extra_limit;


  -- ----------------------------------------------------------
  -- Защита от race condition.
  -- ----------------------------------------------------------

  perform pg_advisory_xact_lock(
    hashtextextended(
      new.user_id::text,
      20260901
    )
  );


  -- ----------------------------------------------------------
  -- Уже опубликованные объявления.
  -- ----------------------------------------------------------

  select count(*)
    into published_count
  from public.listings l
  where l.user_id = new.user_id
    and l.status = 'published';


  if published_count >= total_limit then

    if owner_role = 'realtor' then
      raise exception
        using
          errcode = 'P0001',
          message = format(
            'Лимит объявлений риелтора исчерпан: %s. Можно подключить ещё 10 объявлений за 300 сом в месяц.',
            total_limit
          );
    else
      raise exception
        using
          errcode = 'P0001',
          message = 'Обычный пользователь может иметь не более 3 опубликованных объявлений.';
    end if;

  end if;


  return new;
end;
$$;


-- ============================================================
-- 5. Пересоздаём существующий trigger
-- ============================================================

drop trigger if exists
  listings_regular_user_listing_limit
on public.listings;


create trigger
  listings_regular_user_listing_limit
before insert or update of status
on public.listings
for each row
execute function
  public.enforce_regular_user_listing_limit();


commit;
