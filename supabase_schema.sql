-- ============================================================
-- VANTAGE — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ── 1. waitlist_users ────────────────────────────────────────
create table if not exists public.waitlist_users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  status            text not null default 'PENDING'
                    check (status in ('PENDING','VERIFIED','BOUNCED','UNSUBSCRIBED')),
  created_at        timestamptz not null default now(),
  verified_at       timestamptz,
  app_user_id       uuid,
  ip_first          text,
  user_agent_first  text
);

-- ── 2. squads ────────────────────────────────────────────────
create table if not exists public.squads (
  id                      uuid primary key default gen_random_uuid(),
  owner_waitlist_user_id  uuid not null unique references public.waitlist_users(id) on delete cascade,
  share_code              text not null unique,
  created_at              timestamptz not null default now()
);

-- ── 3. referrals ─────────────────────────────────────────────
create table if not exists public.referrals (
  id                          uuid primary key default gen_random_uuid(),
  squad_id                    uuid not null references public.squads(id) on delete cascade,
  inviter_waitlist_user_id    uuid not null references public.waitlist_users(id) on delete cascade,
  invitee_waitlist_user_id    uuid not null unique references public.waitlist_users(id) on delete cascade,
  status                      text not null default 'PENDING'
                              check (status in ('PENDING','VERIFIED','ACTIVATED','DISQUALIFIED')),
  created_at                  timestamptz not null default now(),
  verified_at                 timestamptz,
  activated_at                timestamptz,
  metadata                    jsonb,
  constraint no_self_referral check (inviter_waitlist_user_id <> invitee_waitlist_user_id)
);

-- ── 4. email_verification_tokens ─────────────────────────────
create table if not exists public.email_verification_tokens (
  id                  uuid primary key default gen_random_uuid(),
  waitlist_user_id    uuid not null references public.waitlist_users(id) on delete cascade,
  token_hash          text not null,
  expires_at          timestamptz not null,
  used_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ── 5. reward_tiers (config — seed data below) ───────────────
create table if not exists public.reward_tiers (
  tier_number           int primary key,
  required_verified     int not null,
  reward_title          text not null,
  reward_description    text not null,
  requires_activation   boolean not null default true
);

insert into public.reward_tiers (tier_number, required_verified, reward_title, reward_description, requires_activation)
values
  (1, 2, 'Free Credits',       'Free credits to bet with at launch.',          true),
  (2, 4, 'Exclusive Cards',    'Exclusive player cards + squad room access.',  true),
  (3, 6, 'Daily Drop Access',  'Massive promos & drops every day.',            true),
  (4, 8, 'Founding Member',    'Founding member status + lifetime perks.',     true)
on conflict (tier_number) do nothing;

-- ── 6. reward_unlocks ────────────────────────────────────────
create table if not exists public.reward_unlocks (
  id                  uuid primary key default gen_random_uuid(),
  waitlist_user_id    uuid not null references public.waitlist_users(id) on delete cascade,
  tier_number         int not null references public.reward_tiers(tier_number),
  status              text not null default 'LOCKED'
                      check (status in ('LOCKED','UNLOCKED','PAYABLE','PAID','REVOKED')),
  unlocked_at         timestamptz,
  payable_at          timestamptz,
  paid_at             timestamptz,
  unique (waitlist_user_id, tier_number)
);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_waitlist_users_email      on public.waitlist_users(email);
create index if not exists idx_squads_share_code         on public.squads(share_code);
create index if not exists idx_referrals_inviter         on public.referrals(inviter_waitlist_user_id);
create index if not exists idx_referrals_squad           on public.referrals(squad_id);
create index if not exists idx_tokens_user               on public.email_verification_tokens(waitlist_user_id);
create index if not exists idx_reward_unlocks_user       on public.reward_unlocks(waitlist_user_id);

-- ── RLS: deny all anon by default ────────────────────────────
alter table public.waitlist_users           enable row level security;
alter table public.squads                   enable row level security;
alter table public.referrals                enable row level security;
alter table public.email_verification_tokens enable row level security;
alter table public.reward_tiers             enable row level security;
alter table public.reward_unlocks           enable row level security;

-- Allow anon to read reward_tiers (public config, safe to expose)
create policy "reward_tiers_public_read"
  on public.reward_tiers for select
  to anon
  using (true);

-- All other tables: only service_role can access (via Next.js API routes)
-- No anon policies created → default deny applies
