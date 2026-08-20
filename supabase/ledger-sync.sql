-- Run this after workspace-isolation.sql in Supabase SQL Editor.
-- Append-only journal for records that must never be overwritten by another device.

create table if not exists public.organization_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null check (event_type in (
    'transaction.created', 'transaction.voided',
    'expense.created', 'expense.updated', 'expense.deleted',
    'inventory.movement', 'shift.closed'
  )),
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists organization_ledger_org_created_idx
  on public.organization_ledger (organization_id, created_at desc);
create index if not exists organization_ledger_entity_idx
  on public.organization_ledger (organization_id, entity_id);

alter table public.organization_ledger enable row level security;
alter table public.organization_ledger replica identity full;

drop policy if exists "members can read organization ledger" on public.organization_ledger;
create policy "members can read organization ledger"
on public.organization_ledger for select
using (public.is_org_member(organization_id));

drop policy if exists "members can append organization ledger" on public.organization_ledger;
create policy "members can append organization ledger"
on public.organization_ledger for insert
with check (public.is_org_member(organization_id) and created_by = auth.uid());

-- Do not allow updates/deletes. Corrections are new audit events.
grant select, insert on public.organization_ledger to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'organization_ledger'
  ) then
    alter publication supabase_realtime add table public.organization_ledger;
  end if;
end $$;
