begin;

-- ============================================================
-- JayMap — Realtor Application Security
-- 2026-08-31
--
-- Защищает создание заявок на риелтора.
--
-- Правило:
-- пользователь может создать только новую заявку со статусом
-- pending. Поля, которые относятся к решению администратора,
-- не могут быть заданы клиентом при INSERT.
--
-- ВАЖНО:
-- - profiles.role НЕ изменяется;
-- - profiles.verification_status НЕ изменяется;
-- - существующая RLS INSERT policy НЕ удаляется;
-- - механизм одобрения/отклонения будет отдельным этапом.
-- ============================================================


-- ============================================================
-- 1. Нормализация данных новой заявки
--
-- Для любой пользовательской INSERT-операции:
--
-- status        -> pending
-- reviewed_at   -> null
-- reviewer_id   -> null
--
-- Поэтому клиент не может создать заявку как approved/rejected
-- или подставить администратора.
-- ============================================================

create or replace function public.prepare_realtor_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.status := 'pending';

  new.reviewed_at := null;

  new.reviewer_id := null;

  return new;
end;
$$;


-- ============================================================
-- 2. Trigger
-- ============================================================

drop trigger if exists
  realtor_applications_prepare_insert
on public.realtor_applications;


create trigger
  realtor_applications_prepare_insert
before insert
on public.realtor_applications
for each row
execute function
  public.prepare_realtor_application_insert();


commit;
