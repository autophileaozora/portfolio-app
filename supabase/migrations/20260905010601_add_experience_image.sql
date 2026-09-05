-- Each experience entry gets its own representative image, uploaded via
-- admin into public-assets (same bucket as profile avatar/CV and project
-- thumbnails). Nullable — falls back to the shared decorative image on the
-- public Home page until an image is set.
alter table public.experience add column image_url text;
