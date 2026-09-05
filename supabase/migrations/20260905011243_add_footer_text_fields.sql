-- The footer's email/social links already come from profile; these three
-- were still hardcoded copy in ContactFooter.svelte. Defaults match the
-- current wording exactly so nothing visibly changes until edited.
alter table public.profile
  add column availability_text text not null default 'Available for work & Discussions',
  add column connect_text text not null default 'Let''s Connected',
  add column footer_copyright text not null default '© 2026 Hello Imanuel. All Rights Reserved.';
