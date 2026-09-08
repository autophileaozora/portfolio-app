-- "Leave a Message" form grows: an optional sender photo, Instagram
-- handle, and a link to which project the sender collaborated on —
-- either picking one of the existing published projects, or proposing a
-- new one that isn't listed yet (which the app-layer schema requires to
-- NOT be anonymous, for accountability — enforced in messageSchema, not
-- here, since RLS can't easily cross-reference two columns like that).
alter table public.messages
  add column sender_avatar_url text,
  add column sender_instagram text,
  add column project_id uuid references public.projects(id) on delete set null,
  add column proposed_project_name text;

-- Visitors submitting a message aren't authenticated, so the existing
-- "authenticated can upload to public-assets" storage policy doesn't
-- cover their optional photo upload. Scoped to just the message-avatars/
-- folder (not the whole bucket) so this stays a narrow carve-out, not a
-- blanket "anyone can write anything" policy.
create policy "anon can upload to message-avatars folder"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'message-avatars');
