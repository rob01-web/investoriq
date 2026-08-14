create table public.disclosure_session_ack_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  disclosure_key text not null,
  disclosure_version text not null,
  disclosure_text_hash text not null,
  session_identifier text not null,
  acknowledged_at timestamptz not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint disclosure_session_ack_events_session_key unique (
    user_id,
    disclosure_version,
    disclosure_text_hash,
    session_identifier
  )
);

alter table public.disclosure_session_ack_events enable row level security;
