-- One-time cleanup: earlier ad-hoc testing (before auto-assign/compaction
-- existed) left all four tables with gaps and a 0-start instead of a dense
-- 1..N sequence. The new position <select> in AdminTable assumes density,
-- so re-flatten every table once here. Safe to run again later (a no-op if
-- already dense) since it's just row_number() over the existing order.
with ranked as (
  select id, row_number() over (order by display_order, created_at) as rn
  from public.skills
)
update public.skills s set display_order = ranked.rn from ranked where ranked.id = s.id;

with ranked as (
  select id, row_number() over (order by display_order, created_at) as rn
  from public.stats
)
update public.stats s set display_order = ranked.rn from ranked where ranked.id = s.id;

with ranked as (
  select id, row_number() over (order by display_order, created_at) as rn
  from public.experience
)
update public.experience s set display_order = ranked.rn from ranked where ranked.id = s.id;

with ranked as (
  select id, row_number() over (order by display_order, created_at) as rn
  from public.testimonials
)
update public.testimonials s set display_order = ranked.rn from ranked where ranked.id = s.id;
