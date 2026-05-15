-- ============================================================
-- FamilyApp Supabase RLS Policies v0.312
-- Initial auth + household access model.
-- Assumes auth.uid() maps to household_members.user_id.
-- ============================================================

-- ------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------
create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.is_household_admin(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner','admin')
  );
$$;

create or replace function public.current_member_id(target_household_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hm.id
  from public.household_members hm
  where hm.household_id = target_household_id
    and hm.user_id = auth.uid()
    and hm.status = 'active'
  limit 1;
$$;

create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

-- ------------------------------------------------------------
-- Household creation helper
-- Creates a household and owner member for the current auth user.
-- ------------------------------------------------------------
create or replace function public.create_household_with_owner(household_name text, owner_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  new_invite_code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  new_invite_code := public.generate_invite_code();

  insert into public.households (name, owner_user_id, invite_code)
  values (coalesce(nullif(household_name, ''), 'Mijn gezin'), auth.uid(), new_invite_code)
  returning id into new_household_id;

  insert into public.household_members (
    household_id,
    user_id,
    display_name,
    initials,
    role,
    status,
    permissions
  ) values (
    new_household_id,
    auth.uid(),
    coalesce(nullif(owner_display_name, ''), 'Owner'),
    upper(substr(coalesce(nullif(owner_display_name, ''), 'O'), 1, 2)),
    'owner',
    'active',
    '{"canCreateQuests":true,"canJoinQuests":true,"canManageHousehold":true}'::jsonb
  );

  return new_household_id;
end;
$$;

-- ------------------------------------------------------------
-- Join household by invite code
-- ------------------------------------------------------------
create or replace function public.join_household_by_invite(invite text, display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
  member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into target_household_id
  from public.households
  where invite_code = upper(invite)
  limit 1;

  if target_household_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.household_members (
    household_id,
    user_id,
    display_name,
    initials,
    role,
    status,
    permissions
  ) values (
    target_household_id,
    auth.uid(),
    coalesce(nullif(display_name, ''), 'Gezinslid'),
    upper(substr(coalesce(nullif(display_name, ''), 'G'), 1, 2)),
    'member',
    'active',
    '{"canCreateQuests":true,"canJoinQuests":true,"canManageHousehold":false}'::jsonb
  )
  on conflict (household_id, user_id)
  do update set
    status = 'active',
    display_name = excluded.display_name,
    updated_at = now()
  returning id into member_id;

  insert into public.activity_events (household_id, actor_member_id, event_type, title, body)
  values (
    target_household_id,
    member_id,
    'member_joined_household',
    'Nieuw gezinslid',
    coalesce(nullif(display_name, ''), 'Gezinslid') || ' is toegetreden tot het huishouden.'
  );

  return target_household_id;
end;
$$;

-- ------------------------------------------------------------
-- RLS: households
-- ------------------------------------------------------------
drop policy if exists households_select_member on public.households;
create policy households_select_member
on public.households
for select
using (public.is_household_member(id));

drop policy if exists households_insert_authenticated on public.households;
create policy households_insert_authenticated
on public.households
for insert
with check (auth.uid() = owner_user_id);

drop policy if exists households_update_admin on public.households;
create policy households_update_admin
on public.households
for update
using (public.is_household_admin(id))
with check (public.is_household_admin(id));

-- ------------------------------------------------------------
-- RLS: household_members
-- ------------------------------------------------------------
drop policy if exists members_select_household on public.household_members;
create policy members_select_household
on public.household_members
for select
using (public.is_household_member(household_id));

drop policy if exists members_insert_self_or_admin on public.household_members;
create policy members_insert_self_or_admin
on public.household_members
for insert
with check (user_id = auth.uid() or public.is_household_admin(household_id));

drop policy if exists members_update_self_or_admin on public.household_members;
create policy members_update_self_or_admin
on public.household_members
for update
using (user_id = auth.uid() or public.is_household_admin(household_id))
with check (user_id = auth.uid() or public.is_household_admin(household_id));

-- ------------------------------------------------------------
-- RLS: quests
-- ------------------------------------------------------------
drop policy if exists quests_select_household on public.quests;
create policy quests_select_household
on public.quests
for select
using (public.is_household_member(household_id));

drop policy if exists quests_insert_household_member on public.quests;
create policy quests_insert_household_member
on public.quests
for insert
with check (public.is_household_member(household_id));

drop policy if exists quests_update_household_member on public.quests;
create policy quests_update_household_member
on public.quests
for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists quests_delete_admin on public.quests;
create policy quests_delete_admin
on public.quests
for delete
using (public.is_household_admin(household_id));

-- ------------------------------------------------------------
-- RLS: quest_steps via parent quest
-- ------------------------------------------------------------
drop policy if exists quest_steps_select_household on public.quest_steps;
create policy quest_steps_select_household
on public.quest_steps
for select
using (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
);

drop policy if exists quest_steps_modify_household on public.quest_steps;
create policy quest_steps_modify_household
on public.quest_steps
for all
using (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
)
with check (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
);

-- ------------------------------------------------------------
-- RLS: party members via parent quest
-- ------------------------------------------------------------
drop policy if exists party_select_household on public.quest_party_members;
create policy party_select_household
on public.quest_party_members
for select
using (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
);

drop policy if exists party_modify_self_or_household on public.quest_party_members;
create policy party_modify_self_or_household
on public.quest_party_members
for all
using (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
)
with check (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
);

-- ------------------------------------------------------------
-- RLS: contributions via parent quest
-- ------------------------------------------------------------
drop policy if exists contributions_select_household on public.quest_contributions;
create policy contributions_select_household
on public.quest_contributions
for select
using (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
);

drop policy if exists contributions_insert_household on public.quest_contributions;
create policy contributions_insert_household
on public.quest_contributions
for insert
with check (
  exists (select 1 from public.quests q where q.id = quest_id and public.is_household_member(q.household_id))
);

-- ------------------------------------------------------------
-- RLS: activity/progression/module items
-- ------------------------------------------------------------
drop policy if exists activity_select_household on public.activity_events;
create policy activity_select_household
on public.activity_events
for select
using (public.is_household_member(household_id));

drop policy if exists activity_insert_household on public.activity_events;
create policy activity_insert_household
on public.activity_events
for insert
with check (public.is_household_member(household_id));

drop policy if exists progression_select_household on public.progression_snapshots;
create policy progression_select_household
on public.progression_snapshots
for select
using (public.is_household_member(household_id));

drop policy if exists progression_modify_household on public.progression_snapshots;
create policy progression_modify_household
on public.progression_snapshots
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists module_items_select_household on public.module_items;
create policy module_items_select_household
on public.module_items
for select
using (public.is_household_member(household_id));

drop policy if exists module_items_modify_household on public.module_items;
create policy module_items_modify_household
on public.module_items
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- ------------------------------------------------------------
-- Public catalog tables: abilities/titles readable by authenticated users.
-- ------------------------------------------------------------
alter table public.abilities enable row level security;
alter table public.titles enable row level security;

drop policy if exists abilities_select_authenticated on public.abilities;
create policy abilities_select_authenticated
on public.abilities
for select
using (auth.uid() is not null);

drop policy if exists titles_select_authenticated on public.titles;
create policy titles_select_authenticated
on public.titles
for select
using (auth.uid() is not null);

drop policy if exists unlocks_select_member_household on public.member_unlocks;
create policy unlocks_select_member_household
on public.member_unlocks
for select
using (
  exists (
    select 1 from public.household_members hm
    where hm.id = member_id
      and public.is_household_member(hm.household_id)
  )
);

drop policy if exists unlocks_modify_self on public.member_unlocks;
create policy unlocks_modify_self
on public.member_unlocks
for all
using (
  exists (
    select 1 from public.household_members hm
    where hm.id = member_id
      and hm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.household_members hm
    where hm.id = member_id
      and hm.user_id = auth.uid()
  )
);
