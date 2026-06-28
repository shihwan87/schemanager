-- Phase 8 — Claude request inbox.
-- CONFIG tab writes here; laptop Claude session reads open rows via npm run claude:inbox.

create table if not exists claude_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  text text not null,
  status text default 'open' check (status in ('open','done','dismissed')),
  response text
);

create index if not exists claude_requests_status_idx on claude_requests (status);
create index if not exists claude_requests_created_idx on claude_requests (created_at desc);
