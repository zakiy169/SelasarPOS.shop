-- Run once in Supabase Dashboard > SQL Editor.
-- This schema keeps every Google account inside its own organization/workspace.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Toko Baru',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'kasir')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.organization_data (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  products jsonb not null default '[]'::jsonb,
  inventory jsonb not null default '[]'::jsonb,
  restaurant_tables jsonb not null default '[]'::jsonb,
  members jsonb not null default '[]'::jsonb,
  transactions jsonb not null default '[]'::jsonb,
  addons jsonb not null default '[]'::jsonb,
  app_settings jsonb not null default '{}'::jsonb,
  active_shift jsonb,
  shift_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_data enable row level security;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = org_id
      and member.user_id = auth.uid()
  );
$$;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations"
on public.organizations for select
using (public.is_org_member(id));

drop policy if exists "members can read their memberships" on public.organization_members;
create policy "members can read their memberships"
on public.organization_members for select
using (user_id = auth.uid());

drop policy if exists "members can read organization data" on public.organization_data;
create policy "members can read organization data"
on public.organization_data for select
using (public.is_org_member(organization_id));

drop policy if exists "members can insert organization data" on public.organization_data;
create policy "members can insert organization data"
on public.organization_data for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update organization data" on public.organization_data;
create policy "members can update organization data"
on public.organization_data for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create or replace function public.create_organization(org_name text default 'Toko Baru')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.organizations (name, owner_id)
  values (coalesce(nullif(trim(org_name), ''), 'Toko Baru'), auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;
