-- Refinement era / least-privilege: trigger-only, security-definer routines
-- should not be callable directly through the PostgREST /rpc endpoint.
-- These four functions are bound to database triggers. Trigger invocation
-- does not require granting EXECUTE directly to anon/authenticated roles.
-- Existing data and trigger definitions remain untouched.
revoke execute on function public.capture_content_revision() from public,anon,authenticated;
revoke execute on function public.create_customer_profile() from public,anon,authenticated;
revoke execute on function public.ensure_arcade_ranking_preference() from public,anon,authenticated;
revoke execute on function public.ensure_exp_ranking_preference() from public,anon,authenticated;
-- Do NOT revoke is_customer_username_available or is_collectible_species;
-- they are callable helpers requiring separate API usage review.
