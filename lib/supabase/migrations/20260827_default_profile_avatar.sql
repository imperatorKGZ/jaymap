begin;

-- ============================================================
-- JAYMAP — DEFAULT PROFILE AVATAR
-- 2026-08-27
-- ============================================================
--
-- Google avatar НЕ считается пользовательским аватаром.
--
-- Если пользователь сам не загрузил фотографию:
-- profiles.avatar_url = NULL
--
-- UI показывает /jaymap-default-avatar.svg
--
-- Если пользователь загружает собственное фото:
-- ProfileEditModal сохраняет URL в profiles.avatar_url.
-- ============================================================


-- ============================================================
-- 1. Сбрасываем уже существующие Google avatars
-- ============================================================
--
-- Текущие пользователи могли получить Google picture
-- в profiles.avatar_url старым trigger.
--
-- Убираем именно Google avatar.
--
-- Пользовательские фотографии из Supabase Storage
-- не затрагиваются.
-- ============================================================

update public.profiles
set
  avatar_url = null,
  updated_at = now()
where avatar_url ilike '%googleusercontent.com%';


-- ============================================================
-- 2. Исправляем trigger создания профиля
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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


commit;