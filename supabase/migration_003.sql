-- Migration 003: add sort_order to categories for drag-reorder.

alter table categories add column if not exists sort_order int default 0;

-- Backfill existing rows with sequential sort_order based on created_at.
with ranked as (
  select id, (row_number() over (order by created_at)) - 1 as rn
  from categories
)
update categories c set sort_order = r.rn
from ranked r
where c.id = r.id;
