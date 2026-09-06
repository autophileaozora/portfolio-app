-- Documentation slides (and, generically, any section) can now carry an
-- image. Nullable — existing rows just have none.
alter table public.project_sections add column image_url text;
