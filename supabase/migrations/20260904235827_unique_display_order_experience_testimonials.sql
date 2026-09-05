-- Same rationale as 20260904175911_unique_display_order_skills_stats.sql,
-- extended to the other two admin-reorderable tables.
alter table public.experience
  add constraint experience_display_order_unique unique (display_order);

alter table public.testimonials
  add constraint testimonials_display_order_unique unique (display_order);
