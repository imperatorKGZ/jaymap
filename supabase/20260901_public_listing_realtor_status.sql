begin;

-- ============================================================
-- JayMap — Public listing realtor status
-- 2026-09-01
--
-- Публично сообщаем только роль владельца активного объявления.
-- Никаких персональных данных или контактов здесь нет.
--
-- ListingPopup использует этот RPC, чтобы отличать объявления
-- риелтора от обычных объявлений.
-- ============================================================

create or replace function public.get_public_listing_realtor_status(
  p_listing_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings l
    join public.profiles p
      on p.id = l.user_id
    where l.id = p_listing_id
      and l.is_active = true
      and p.role = 'realtor'
  );
$$;


revoke all
  on function public.get_public_listing_realtor_status(uuid)
  from public;


grant execute
  on function public.get_public_listing_realtor_status(uuid)
  to anon, authenticated;


commit;
