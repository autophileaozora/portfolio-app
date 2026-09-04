-- Two rows sharing a display_order value is a data-integrity bug, not a
-- valid state (the admin UI lets you reorder, not "co-locate" rows) — so
-- reject it at the DB level rather than only in application code, which
-- would miss future write paths.
alter table public.skills
  add constraint skills_display_order_unique unique (display_order);

alter table public.stats
  add constraint stats_display_order_unique unique (display_order);
