-- Lets a testimonial optionally be tied to a specific project. Nullable —
-- existing testimonials stay unlinked (shown in the general/site-wide pool
-- everywhere), and the project detail page shows only the testimonials
-- linked to that project (falling back to its own "no testimonials yet"
-- empty state when none exist, never mixing in the general pool).
alter table public.testimonials
  add column project_id uuid references public.projects(id) on delete set null;

create index testimonials_project_id_idx on public.testimonials (project_id);
