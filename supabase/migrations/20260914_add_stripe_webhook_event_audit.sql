create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  processed boolean not null default false,
  outcome text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events enable row level security;

create index if not exists stripe_webhook_events_received_at_idx
  on public.stripe_webhook_events (received_at desc);
