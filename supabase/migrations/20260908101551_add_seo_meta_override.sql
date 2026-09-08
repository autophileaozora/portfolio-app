-- Direct override for what shows up in a Google search snippet (title +
-- description) — previously the Home page's title/description were only
-- ever auto-derived from `profile` fields (full_name/title/location/
-- summary_paragraph) with no way to type the exact wording directly, the
-- way each individual project already can via projects.meta_title/
-- meta_description. When set, these take priority over that auto-derived
-- text on Home, and serve as the fallback (lowest priority, under the
-- page's own computed title) on the Projects listing.
alter table public.seo_settings
  add column meta_title text,
  add column meta_description text;
