begin;

-- ============================================================
-- JayMap — Regular User Listing Limit
-- 2026-08-31
--
-- Правило:
-- Обычный пользователь (profiles.role = 'user')
-- может иметь максимум 3 опубликованных объявления
-- одновременно.
--
-- ВАЖНО:
-- - draft не считается;
-- - paused не считается;
-- - archived не считается;
-- - realtor/admin пока не ограничиваются этим правилом;
-- - существующий lifecycle не изменяется;
-- - существующий trigger status -> is_active не изменяется.
-- ============================================================


-- ============================================================
-- 1. Проверка лимита перед публикацией
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
begin

  -- ----------------------------------------------------------
  -- INSERT
  -- ----------------------------------------------------------
  if tg_op = 'INSERT' then

    -- Правило применяется только если запись сразу создаётся
    -- опубликованной.
    if new.status <> 'published' then
      return new;
    end if;

  -- ----------------------------------------------------------
  -- UPDATE
  -- ----------------------------------------------------------
  elsif tg_op = 'UPDATE' then

    -- Нас интересует только переход:
    --
    -- draft / paused / archived
    --              ↓
    --          published
    --
    if old.status = 'published'
       or new.status <> 'published'
    then
      return new;
    end if;

  end if;


  -- ----------------------------------------------------------
  -- Определяем роль владельца объявления.
  -- ----------------------------------------------------------

  select p.role
    into owner_role
  from public.profiles p
  where p.id = new.user_id;


  -- Если профиль не найден или роль не user,
  -- это правило не применяется.
  if owner_role is distinct from 'user' then
    return new;
  end if;


  -- ----------------------------------------------------------
  -- Защита от race condition.
  --
  -- Если пользователь одновременно отправит несколько
  -- запросов на публикацию, операции одного user_id
  -- выполняются последовательно внутри транзакции.
  -- ----------------------------------------------------------

  perform pg_advisory_xact_lock(
    hashtextextended(
      new.user_id::text,
      20260831
    )
  );


  -- ----------------------------------------------------------
  -- Считаем уже опубликованные объявления пользователя.
  --
  -- При UPDATE публикуемая запись ещё не считается,
  -- потому что trigger BEFORE UPDATE.
  -- ----------------------------------------------------------

  select count(*)
    into published_count
  from public.listings l
  where l.user_id = new.user_id
    and l.status = 'published';


  -- ----------------------------------------------------------
  -- Максимум 3 опубликованных объявления.
  -- ----------------------------------------------------------

  if published_count >= 3 then

    raise exception
      using
        errcode = 'P0001',
        message = 'Обычный пользователь может иметь не более 3 опубликованных объявлений.';

  end if;


  return new;
end;
$$;


-- ============================================================
-- 2. Trigger
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