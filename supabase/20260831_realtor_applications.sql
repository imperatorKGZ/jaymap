begin;

-- ============================================================
-- JayMap — Realtor Applications
-- 2026-08-31
--
-- Заявка пользователя на получение статуса realtor.
--
-- ВАЖНО:
-- - эта таблица хранит именно историю заявок;
-- - profiles.role здесь НЕ меняется;
-- - profiles.verification_status здесь НЕ меняется;
-- - решение администратора будет реализовано отдельным RPC
--   на следующем этапе;
-- ============================================================


-- ============================================================
-- 1. Таблица заявок
-- ============================================================

create table if not exists public.realtor_applications (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  full_name text not null,

  phone text not null,

  agency_name text,

  social_url text,

  photo_url text not null,

  status text not null
    default 'pending'
    check (
      status in (
        'pending',
        'approved',
        'rejected'
      )
    ),

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  reviewed_at timestamptz,

  reviewer_id uuid
    references auth.users(id)
    on delete set null
);


-- ============================================================
-- 2. Индексы
-- ============================================================

create index if not exists
  idx_realtor_applications_user_id
on public.realtor_applications(user_id);


create index if not exists
  idx_realtor_applications_status
on public.realtor_applications(status);


create index if not exists
  idx_realtor_applications_created_at
on public.realtor_applications(created_at desc);


-- ============================================================
-- 3. Только одна активная pending-заявка
--    на одного пользователя.
--
-- После rejected пользователь сможет подать повторно.
-- После approved новую заявку подавать не должен.
-- Дополнительную защиту approved реализуем при submit.
-- ============================================================

create unique index if not exists
  uq_realtor_applications_one_pending
on public.realtor_applications(user_id)
where status = 'pending';


-- ============================================================
-- 4. updated_at
-- ============================================================

drop trigger if exists
  realtor_applications_updated_at
on public.realtor_applications;


create trigger realtor_applications_updated_at
before update on public.realtor_applications
for each row
execute function public.update_updated_at();


-- ============================================================
-- 5. RLS
-- ============================================================

alter table public.realtor_applications
  enable row level security;


-- ------------------------------------------------------------
-- Пользователь может видеть только свои заявки.
-- ------------------------------------------------------------

drop policy if exists
  "realtor_applications_select_own"
on public.realtor_applications;


create policy
  "realtor_applications_select_own"
on public.realtor_applications
for select
to authenticated
using (
  auth.uid() = user_id
);


-- ------------------------------------------------------------
-- Пользователь может создать заявку только для себя.
-- ------------------------------------------------------------

drop policy if exists
  "realtor_applications_insert_own"
on public.realtor_applications;


create policy
  "realtor_applications_insert_own"
on public.realtor_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
);


-- ------------------------------------------------------------
-- Пользователь НЕ получает прямой UPDATE заявки.
--
-- После создания статус и данные заявки должны
-- проходить через контролируемую серверную логику.
-- ------------------------------------------------------------

drop policy if exists
  "realtor_applications_update_own"
on public.realtor_applications;


-- Намеренно не создаём UPDATE policy.


-- ------------------------------------------------------------
-- Пользователь не может DELETE заявку.
-- ------------------------------------------------------------

drop policy if exists
  "realtor_applications_delete_own"
on public.realtor_applications;


-- Намеренно не создаём DELETE policy.


commit;