-- ── projects: same dense-1..N pattern as skills/stats/experience/testimonials ──
alter table public.projects
  add constraint projects_display_order_unique unique (display_order) deferrable initially deferred;

-- Re-declare with 'projects' added to the allowlist (CREATE OR REPLACE keeps
-- the same signature/grants in place; only the body changes).
create or replace function public.reorder_ranked_item(
  target_table text,
  target_id uuid,
  new_order integer
) returns void
language plpgsql
set search_path = public
as $$
declare
  old_order integer;
begin
  if target_table not in ('skills', 'stats', 'experience', 'testimonials', 'projects') then
    raise exception 'reorder_ranked_item: invalid table %', target_table;
  end if;

  execute format('select display_order from public.%I where id = $1', target_table)
    into old_order using target_id;

  if old_order is null then
    raise exception 'reorder_ranked_item: row % not found in %', target_id, target_table;
  end if;

  if new_order = old_order then
    return;
  end if;

  if new_order < old_order then
    execute format(
      'update public.%I set display_order = display_order + 1 where display_order >= $1 and display_order < $2',
      target_table
    ) using new_order, old_order;
  else
    execute format(
      'update public.%I set display_order = display_order - 1 where display_order > $1 and display_order <= $2',
      target_table
    ) using old_order, new_order;
  end if;

  execute format('update public.%I set display_order = $1 where id = $2', target_table)
    using new_order, target_id;
end;
$$;

create or replace function public.compact_ranked_table(
  target_table text,
  deleted_order integer
) returns void
language plpgsql
set search_path = public
as $$
begin
  if target_table not in ('skills', 'stats', 'experience', 'testimonials', 'projects') then
    raise exception 'compact_ranked_table: invalid table %', target_table;
  end if;

  execute format('update public.%I set display_order = display_order - 1 where display_order > $1', target_table)
    using deleted_order;
end;
$$;

-- ── project_sections: same idea, but scoped to (project_id, type) — a
-- problem/solution/result/documentation group orders independently within
-- its own project, not across the whole table (see +page.svelte's
-- sectionsByType: only within-type order is ever rendered).
alter table public.project_sections
  add constraint project_sections_type_order_unique
  unique (project_id, type, display_order) deferrable initially deferred;

create or replace function public.reorder_project_section(
  section_id uuid,
  new_order integer
) returns void
language plpgsql
set search_path = public
as $$
declare
  old_order integer;
  target_project_id uuid;
  target_type text;
begin
  select project_id, type, display_order
    into target_project_id, target_type, old_order
    from public.project_sections
    where id = section_id;

  if old_order is null then
    raise exception 'reorder_project_section: section % not found', section_id;
  end if;

  if new_order = old_order then
    return;
  end if;

  if new_order < old_order then
    update public.project_sections
      set display_order = display_order + 1
      where project_id = target_project_id
        and type = target_type
        and display_order >= new_order
        and display_order < old_order;
  else
    update public.project_sections
      set display_order = display_order - 1
      where project_id = target_project_id
        and type = target_type
        and display_order > old_order
        and display_order <= new_order;
  end if;

  update public.project_sections set display_order = new_order where id = section_id;
end;
$$;

create or replace function public.compact_project_sections(
  target_project_id uuid,
  target_type text,
  deleted_order integer
) returns void
language plpgsql
set search_path = public
as $$
begin
  update public.project_sections
    set display_order = display_order - 1
    where project_id = target_project_id
      and type = target_type
      and display_order > deleted_order;
end;
$$;

revoke all on function public.reorder_project_section(uuid, integer) from public;
revoke execute on function public.reorder_project_section(uuid, integer) from anon;
grant execute on function public.reorder_project_section(uuid, integer) to authenticated;

revoke all on function public.compact_project_sections(uuid, text, integer) from public;
revoke execute on function public.compact_project_sections(uuid, text, integer) from anon;
grant execute on function public.compact_project_sections(uuid, text, integer) to authenticated;
