-- JayMap: enforce Instagram profile URLs for realtor applications.
--
-- This constraint is intentionally added as NOT VALID so existing historical
-- applications do not block deployment. PostgreSQL still enforces the CHECK
-- for every new INSERT and every UPDATE after this migration is applied.
-- Existing invalid rows can be cleaned up later and the constraint can then
-- be validated with:
--   ALTER TABLE public.realtor_applications
--   VALIDATE CONSTRAINT realtor_applications_instagram_url_check;

ALTER TABLE public.realtor_applications
  DROP CONSTRAINT IF EXISTS realtor_applications_instagram_url_check;

ALTER TABLE public.realtor_applications
  ADD CONSTRAINT realtor_applications_instagram_url_check
  CHECK (
    social_url IS NOT NULL
    AND social_url ~* '^https://(www\.)?instagram\.com/[A-Za-z0-9._]{1,30}/?$'
    AND social_url !~ '[?]'
    AND social_url !~ '[#]'
    AND social_url !~ '/\.'
    AND social_url !~ '\./'
    AND social_url !~ '\.\.'
  )
  NOT VALID;
