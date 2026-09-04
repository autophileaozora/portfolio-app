-- "Leave a Message" — the one table where the public can write, not just read.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text,
  is_anonymous boolean not null default false,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'answered')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now(),

  constraint messages_content_not_blank check (btrim(content) <> '')
);

create index messages_status_idx on public.messages (status, created_at desc);
