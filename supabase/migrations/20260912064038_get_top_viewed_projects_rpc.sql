-- Powers the Home page's hero carousel ("show the projects with the most
-- views"). analytics_events has no anon SELECT policy at all (visitor
-- IPs, referrers, etc. — real PII, correctly not public), so the Home
-- page can't just query it directly the way a normal anon request could.
-- This function is the safe middle ground: security definer runs it with
-- the privileges of whoever owns it (bypassing analytics_events' RLS for
-- this one controlled aggregation), but it only ever returns a project id
-- + a view count — never a raw event row, never anything PII-shaped —
-- so granting anon EXECUTE on it doesn't reopen the table itself.
create or replace function public.get_top_viewed_projects(result_limit integer default 6)
returns table (project_id uuid, view_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id as project_id, count(*) as view_count
  from public.analytics_events ae
  join public.projects p on ae.path = '/projects/' || p.slug
  where ae.event_type = 'pageview' and p.is_published = true
  group by p.id
  order by view_count desc
  limit result_limit;
$$;

revoke all on function public.get_top_viewed_projects(integer) from public;
grant execute on function public.get_top_viewed_projects(integer) to anon, authenticated;
