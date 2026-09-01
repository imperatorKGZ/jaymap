begin;

-- ============================================================
-- JayMap — Admin Dashboard Statistics
-- 2026-08-31
--
-- Административная статистика через SECURITY DEFINER RPC.
--
-- Почему отдельный RPC:
-- обычные RLS-политики ограничивают доступ к профилям,
-- объявлениям и заявкам владельцем записи. Admin GUI не должен
-- обходить RLS прямыми SELECT-запросами.
--
-- RPC сам проверяет profiles.role = 'admin' и только после этого
-- возвращает агрегированные данные.
-- ============================================================

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = current_user_id
      and p.role = 'admin'
  ) then
    raise exception using
      errcode = '42501',
      message = 'Only administrators can access dashboard statistics';
  end if;

  return jsonb_build_object(
    'users',
    (
      select count(*)::integer
      from public.profiles
    ),

    'listings',
    (
      select count(*)::integer
      from public.listings
    ),

    'active_listings',
    (
      select count(*)::integer
      from public.listings
      where is_active = true
    ),

    'realtors',
    (
      select count(*)::integer
      from public.profiles
      where role = 'realtor'
    ),

    'pending_realtor_applications',
    (
      select count(*)::integer
      from public.realtor_applications
      where status = 'pending'
    )
  );
end;
$$;


revoke all
  on function public.get_admin_dashboard_stats()
  from public;

grant execute
  on function public.get_admin_dashboard_stats()
  to authenticated;

commit;
