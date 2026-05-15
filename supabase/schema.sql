-- ============================================================
-- FamilyApp Supabase Schema v0.311
-- Initial production data model for live household multiplayer.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mijn gezin',
  owner_user_id uuid not null,
  invite_code text unique,
  avatar_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid,
  display_name text not null,
  initials text,
  avatar_url text,
  role text not null default 'member' check (role in ('owner','admin','member','child')),
  status text not null default 'active' check (status in ('active','invited','left','disabled')),
  xp integer not null default 0,
  level integer not null default 1,
  active_title_id uuid,
  equipped_abilities jsonb not null default '[]'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  permissions jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(household_id, user_id),
  unique(household_id, display_name)
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_member_id uuid references public.household_members(id) on delete set null,
  owner_member_id uuid references public.household_members(id) on delete set null,
  title text not null,
  description text,
  quest_kind text not null default 'task' check (quest_kind in ('task','group','dungeon','raid','adventure','pvp','main','recurring')),
  cadence text check (cadence in ('daily','weekly','monthly','yearly')),
  status text not null default 'open' check (status in ('draft','open','in_progress','completed','archived','failed')),
  difficulty text not null default 'normal' check (difficulty in ('easy','normal','hard','epic','legendary')),
  rarity text not null default 'common' check (rarity in ('common','uncommon','rare','epic','legendary')),
  tags text[] not null default array[]::text[],
  xp_reward integer not null default 0,
  coin_reward integer not null default 0,
  multiplier numeric(6,3) not null default 1,
  target integer not null default 1,
  progress integer not null default 0,
  due_at timestamptz,
  starts_at timestamptz,
  completed_at timestamptz,
  auto_background boolean not null default true,
  background_key text,
  background_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_steps (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','completed','skipped')),
  assigned_member_id uuid references public.household_members(id) on delete set null,
  completed_by_member_id uuid references public.household_members(id) on delete set null,
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quest_party_members (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  member_id uuid not null references public.household_members(id) on delete cascade,
  status text not null default 'joined' check (status in ('invited','joined','left','declined')),
  role text default 'member',
  contribution_count integer not null default 0,
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(quest_id, member_id)
);

create table if not exists public.quest_contributions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quests(id) on delete cascade,
  member_id uuid references public.household_members(id) on delete set null,
  step_id uuid references public.quest_steps(id) on delete set null,
  contribution_type text not null default 'progress' check (contribution_type in ('progress','step_completed','join','leave','comment','ability_used','completed')),
  amount integer not null default 1,
  xp_delta integer not null default 0,
  coin_delta integer not null default 0,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_member_id uuid references public.household_members(id) on delete set null,
  target_member_id uuid references public.household_members(id) on delete set null,
  quest_id uuid references public.quests(id) on delete cascade,
  event_type text not null,
  title text,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.progression_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid references public.household_members(id) on delete cascade,
  scope text not null default 'member' check (scope in ('household','member')),
  xp integer not null default 0,
  level integer not null default 1,
  coins integer not null default 0,
  streaks jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(household_id, member_id, scope)
);

create table if not exists public.abilities (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  ability_type text not null check (ability_type in ('passive','active')),
  rarity text not null default 'common' check (rarity in ('common','uncommon','rare','epic','legendary')),
  cooldown_seconds integer not null default 0,
  effects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  rarity text not null default 'common' check (rarity in ('common','uncommon','rare','epic','legendary')),
  effects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.member_unlocks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.household_members(id) on delete cascade,
  unlock_type text not null check (unlock_type in ('ability','title','cosmetic','reward')),
  ability_id uuid references public.abilities(id) on delete cascade,
  title_id uuid references public.titles(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  unique(member_id, unlock_type, ability_id, title_id)
);

create table if not exists public.module_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by_member_id uuid references public.household_members(id) on delete set null,
  module_key text not null check (module_key in ('recipes','meals','groceries','notes')),
  title text not null,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_household_members_household on public.household_members(household_id);
create index if not exists idx_quests_household_status on public.quests(household_id, status);
create index if not exists idx_quests_kind on public.quests(household_id, quest_kind);
create index if not exists idx_quest_steps_quest on public.quest_steps(quest_id, sort_order);
create index if not exists idx_party_quest on public.quest_party_members(quest_id);
create index if not exists idx_party_member on public.quest_party_members(member_id);
create index if not exists idx_contributions_quest on public.quest_contributions(quest_id, created_at desc);
create index if not exists idx_activity_household on public.activity_events(household_id, created_at desc);
create index if not exists idx_module_items_household_module on public.module_items(household_id, module_key, status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_households_updated_at on public.households;
create trigger set_households_updated_at before update on public.households for each row execute function public.set_updated_at();

drop trigger if exists set_household_members_updated_at on public.household_members;
create trigger set_household_members_updated_at before update on public.household_members for each row execute function public.set_updated_at();

drop trigger if exists set_quests_updated_at on public.quests;
create trigger set_quests_updated_at before update on public.quests for each row execute function public.set_updated_at();

drop trigger if exists set_quest_steps_updated_at on public.quest_steps;
create trigger set_quest_steps_updated_at before update on public.quest_steps for each row execute function public.set_updated_at();

drop trigger if exists set_party_updated_at on public.quest_party_members;
create trigger set_party_updated_at before update on public.quest_party_members for each row execute function public.set_updated_at();

drop trigger if exists set_module_items_updated_at on public.module_items;
create trigger set_module_items_updated_at before update on public.module_items for each row execute function public.set_updated_at();

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.quests enable row level security;
alter table public.quest_steps enable row level security;
alter table public.quest_party_members enable row level security;
alter table public.quest_contributions enable row level security;
alter table public.activity_events enable row level security;
alter table public.progression_snapshots enable row level security;
alter table public.member_unlocks enable row level security;
alter table public.module_items enable row level security;

-- NOTE: RLS policies will be added with auth + household invite flow.
