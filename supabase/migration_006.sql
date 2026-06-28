-- Phase 8.1 — categories per scope (WORK vs PERSONAL).
-- Existing rows backfill to scope='work'.
-- Personal scope gets its own Uncategorized fallback + a few sensible defaults.

alter table categories
  add column if not exists scope text not null default 'work'
    check (scope in ('work','personal'));

-- Replace global unique(name) with composite unique(scope, name) so each scope
-- can have its own "Uncategorized", "Health", etc. without colliding.
alter table categories drop constraint if exists categories_name_key;
create unique index if not exists categories_scope_name_uq on categories (scope, name);

create index if not exists categories_scope_idx on categories (scope);

-- Seed Personal-scope defaults (idempotent).
insert into categories (name, color, is_default, scope) values
  ('Uncategorized', '#8a8fa3', true,  'personal'),
  ('Health',        '#4ecf7a', false, 'personal'),
  ('Finance',       '#ffb454', false, 'personal'),
  ('Home',          '#4a9eff', false, 'personal'),
  ('Hobbies',       '#c47aff', false, 'personal')
on conflict (scope, name) do nothing;

-- Update the reassign trigger so deleting a category only affects projects
-- in the same scope (otherwise a Work "Health" delete would clobber Personal
-- "Health" projects, and vice versa).
create or replace function reassign_to_uncategorized()
returns trigger language plpgsql as $$
begin
  update projects
     set category = 'Uncategorized'
   where category = old.name
     and scope = old.scope;
  return old;
end $$;
