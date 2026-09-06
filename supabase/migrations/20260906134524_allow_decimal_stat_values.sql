-- "Years in IT Fields" is now summed from each experience row's own
-- duration in months, converted to years to 1 decimal place (per the
-- user's explicit request: "jangan bulat" — don't round it to a whole
-- number) instead of always being a whole number like the other 3
-- auto-tracked stats. numeric(6,1) keeps plenty of headroom for any
-- ordinary stat (integer or one decimal place) while rejecting anything
-- wilder than that.
alter table public.stats
  alter column value type numeric(6,1) using value::numeric(6,1);
