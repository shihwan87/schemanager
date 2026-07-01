-- Phase 8.2 — reserved 'Archived' category per scope.
-- Projects auto-move here when every step is Done. User restores manually
-- by editing the project's category.

insert into categories (name, color, is_default, scope) values
  ('Archived', '#6b7280', true, 'work'),
  ('Archived', '#6b7280', true, 'personal')
on conflict (scope, name) do nothing;
