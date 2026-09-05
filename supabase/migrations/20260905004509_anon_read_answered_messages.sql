-- Per user decision: once admin replies, a message becomes a public
-- "answered" showcase (like a guestbook) — pending/unanswered messages stay
-- fully private (still no anon SELECT policy matches those rows).
create policy "anon can read answered messages"
  on public.messages for select
  to anon
  using (status = 'answered');
