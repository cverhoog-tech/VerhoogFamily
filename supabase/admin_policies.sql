-- ============================================================
-- FamilyApp Admin / Moderator Foundation v0.313
-- Adds app-level admin roles and audit logging for future /admin console.
-- Normal household users remain limited to their own household.
-- ============================================================

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role text not null default 'support' check (role in ('owner','admin','support','readonly')),
  status text not null default 'active' check (status in ('active','disabled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  household_id uuid references public.households(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_app_admin(required_roles text[] default array['owner','admin','support','readonly'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins aa
    where aa.user_id = auth.uid()
      and aa.status = 'active'
      and aa.role = any(required_roles)
  );
$$;

create or replace function public.log_admin_action(
  action_name text,
  target_type text default null,
  target_id uuid default null,
  target_household_id uuid default null,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if not public.is_app_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    household_id,
    metadata
  ) values (
    auth.uid(),
    action_name,
    target_type,
    target_id,
    target_household_id,
    coalesce(metadata, '{}'::jsonb)
  ) returning id into audit_id;

  return audit_id;
end;
$$;

-- Admin overview view for future /admin dashboard.
create or replace view public.admin_household_overview as
select
  h.id,
  h.name,
  h.owner_user_id,
  h.invite_code,
  h.created_at,
  h.updated_at,
  count(distinct hm.id) filter (where hm.status = 'active') as active_members,
  count(distinct q.id) filter (where q.status in ('open','in_progress')) as active_quests,
  max(ae.created_at) as last_activity_at
from public.households h
left join public.household_members hm on hm.household_id = h.id
left join public.quests q on q.household_id = h.id
left join public.activity_events ae on ae.household_id = h.id
group by h.id;

alter table public.app_admins enable row level security;
alter table public.admin_audit_log enable row level security;

-- Only existing app admins can read admin role data.
drop policy if exists app_admins_select_admin on public.app_admins;
create policy app_admins_select_admin
on public.app_admins
for select
using (public.is_app_admin(array['owner','admin','support','readonly']));

-- Only owner/admin can manage admin users.
drop policy if exists app_admins_manage_owner_admin on public.app_admins;
create policy app_admins_manage_owner_admin
on public.app_admins
for all
using (public.is_app_admin(array['owner','admin']))
with check (public.is_app_admin(array['owner','admin']));

-- Admin audit log is readable by admins/support, writable only through function/policy.
drop policy if exists admin_audit_select_admin on public.admin_audit_log;
create policy admin_audit_select_admin
on public.admin_audit_log
for select
using (public.is_app_admin(array['owner','admin','support','readonly']));

drop policy if exists admin_audit_insert_admin on public.admin_audit_log;
create policy admin_audit_insert_admin
on public.admin_audit_log
for insert
with check (public.is_app_admin(array['owner','admin','support']));

-- Admin override read access for support console.
-- These policies add admin visibility without weakening normal household-member policies.
drop policy if exists households_select_app_admin on public.households;
create policy households_select_app_admin
on public.households
for select
using (public.is_app_admin(array['owner','admin','support','readonly']));

drop policy if exists members_select_app_admin on public.household_members;
create policy members_select_app_admin
on public.household_members
for select
using (public.is_app_admin(array['owner','admin','support','readonly']));

drop policy if exists quests_select_app_admin on public.quests;
create policy quests_select_app_admin
on public.quests
for select
using (public.is_app_admin(array['owner','admin','support','readonly']));

drop policy if exists activity_select_app_admin on public.activity_events;
create policy activity_select_app_admin
on public.activity_events
for select
using (public.is_app_admin(array['owner','admin','support','readonly']));

-- Admins may update households only as owner/admin, not support/readonly.
drop policy if exists households_update_app_admin on public.households;
create policy households_update_app_admin
on public.households
for update
using (public.is_app_admin(array['owner','admin']))
with check (public.is_app_admin(array['owner','admin']));

-- Note: first admin bootstrap should be done manually in Supabase SQL editor:
-- insert into public.app_admins (user_id, role) values ('<YOUR_AUTH_USER_UUID>', 'owner');
