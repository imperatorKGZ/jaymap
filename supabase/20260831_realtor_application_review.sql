begin;

-- JayMap — Realtor Application Review
-- Only administrators may approve/reject applications.
-- Approval changes profiles.role to realtor and
-- profiles.verification_status to verified.

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id then
      raise exception 'Profile id cannot be changed';
    end if;

    if auth.role() <> 'service_role'
       and not exists (
         select 1
         from public.profiles p
         where p.id = auth.uid()
           and p.role = 'admin'
       )
    then
      if new.role is distinct from old.role then
        raise exception
          'Profile role can only be changed by system administrator';
      end if;

      if new.verification_status is distinct from old.verification_status then
        raise exception
          'Verification status can only be changed by system administrator';
      end if;
    end if;
  end if;

  return new;
end;
$$;


create or replace function public.approve_realtor_application(
  p_application_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  application_user_id uuid;
  application_status text;
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
      message = 'Only administrators can approve realtor applications';
  end if;

  select ra.user_id, ra.status
    into application_user_id, application_status
  from public.realtor_applications ra
  where ra.id = p_application_id
  for update;

  if application_user_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'Realtor application not found';
  end if;

  if application_status <> 'pending' then
    raise exception using
      errcode = 'P0001',
      message = 'Only pending realtor applications can be approved';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = application_user_id
      and p.role = 'user'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Application owner is not a regular user';
  end if;

  update public.profiles
  set
    role = 'realtor',
    verification_status = 'verified',
    updated_at = now()
  where id = application_user_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Profile for realtor application was not found';
  end if;

  update public.realtor_applications
  set
    status = 'approved',
    reviewed_at = now(),
    reviewer_id = current_user_id,
    updated_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'application_id', p_application_id,
    'user_id', application_user_id,
    'status', 'approved'
  );
end;
$$;


create or replace function public.reject_realtor_application(
  p_application_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  application_user_id uuid;
  application_status text;
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
      message = 'Only administrators can reject realtor applications';
  end if;

  select ra.user_id, ra.status
    into application_user_id, application_status
  from public.realtor_applications ra
  where ra.id = p_application_id
  for update;

  if application_user_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'Realtor application not found';
  end if;

  if application_status <> 'pending' then
    raise exception using
      errcode = 'P0001',
      message = 'Only pending realtor applications can be rejected';
  end if;

  update public.realtor_applications
  set
    status = 'rejected',
    reviewed_at = now(),
    reviewer_id = current_user_id,
    updated_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'application_id', p_application_id,
    'user_id', application_user_id,
    'status', 'rejected'
  );
end;
$$;


revoke all
  on function public.approve_realtor_application(uuid)
  from public;

revoke all
  on function public.reject_realtor_application(uuid)
  from public;

grant execute
  on function public.approve_realtor_application(uuid)
  to authenticated;

grant execute
  on function public.reject_realtor_application(uuid)
  to authenticated;

commit;
