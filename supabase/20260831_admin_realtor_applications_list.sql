begin;

-- ============================================================
-- JayMap — Admin Realtor Applications List
-- 2026-08-31
--
-- Admin GUI needs a controlled read path for applications.
-- Direct SELECT from the browser is intentionally not opened:
-- realtor_applications RLS allows a user to see only own records.
--
-- This RPC returns all applications for administrators only.
-- ============================================================

create or replace function public.get_admin_realtor_applications(
  p_status text default 'pending'
)
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  phone text,
  agency_name text,
  social_url text,
  photo_url text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  reviewed_at timestamptz,
  reviewer_id uuid
)
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
      message = 'Only administrators can access realtor applications';
  end if;

  if p_status not in (
    'pending',
    'approved',
    'rejected'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid application status';
  end if;

  return query
  select
    ra.id,
    ra.user_id,
    ra.full_name,
    ra.phone,
    ra.agency_name,
    ra.social_url,
    ra.photo_url,
    ra.status,
    ra.created_at,
    ra.updated_at,
    ra.reviewed_at,
    ra.reviewer_id
  from public.realtor_applications ra
  where ra.status = p_status
  order by
    case
      when ra.status = 'pending' then 0
      else 1
    end,
    ra.created_at desc;
end;
$$;


revoke all
  on function public.get_admin_realtor_applications(text)
  from public;

grant execute
  on function public.get_admin_realtor_applications(text)
  to authenticated;

commit;
