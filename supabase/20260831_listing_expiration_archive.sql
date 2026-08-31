begin;

-- ============================================================
-- JayMap — Automatic listing expiration archive
-- 2026-08-31
--
-- Правило:
-- published + expires_at <= now()
--        ↓
-- archived
--
-- Физически объявления НЕ удаляются.
--
-- Уже существующий trigger:
-- listings_sync_active_state
-- автоматически установит:
-- archived -> is_active = false
-- ============================================================


-- ============================================================
-- 1. Функция автоматического архивирования
-- ============================================================

create or replace function public.archive_expired_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer;
begin

  update public.listings
  set status = 'archived'
  where status = 'published'
    and expires_at is not null
    and expires_at <= now();

  get diagnostics
    archived_count = row_count;

  return archived_count;
end;
$$;


-- ============================================================
-- 2. Закрываем функцию для обычных клиентов
--
-- Её вызывает только cron.
-- ============================================================

revoke execute
on function public.archive_expired_listings()
from public, anon, authenticated;


-- ============================================================
-- 3. Создаём cron job
--
-- Каждый час:
--   expired published -> archived
--
-- Проверяем наличие job, чтобы повторный запуск миграции
-- не создал дубликат.
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from cron.job
    where jobname =
      'jaymap-archive-expired-listings'
  ) then

    perform cron.schedule(
      'jaymap-archive-expired-listings',
      '0 * * * *',
      $cron$
        select public.archive_expired_listings();
      $cron$
    );

  end if;

end;
$$;


commit;