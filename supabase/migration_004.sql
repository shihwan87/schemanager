-- Phase 8 — scope (WORK vs PERSONAL) and priority columns on projects.
-- Existing rows backfill via column defaults.

alter table projects
  add column if not exists scope text not null default 'work'
    check (scope in ('work','personal'));

alter table projects
  add column if not exists priority text not null default 'mid'
    check (priority in ('high','mid','low'));

create index if not exists projects_scope_idx on projects (scope);
create index if not exists projects_priority_idx on projects (priority);
