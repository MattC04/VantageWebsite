create extension if not exists "pgcrypto";

create table if not exists public.waitlist_users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  share_code  text unique,
  created_at  timestamptz not null default now(),
  ip_first    text
);

create index if not exists idx_waitlist_users_email      on public.waitlist_users(email);
create index if not exists idx_waitlist_users_share_code on public.waitlist_users(share_code);

alter table public.waitlist_users enable row level security;

create table if not exists public.referrals (
  id          uuid primary key default gen_random_uuid(),
  inviter_id  uuid not null references public.waitlist_users(id) on delete cascade,
  invitee_id  uuid not null unique references public.waitlist_users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint no_self_referral check (inviter_id <> invitee_id)
);

create index if not exists idx_referrals_inviter on public.referrals(inviter_id);

alter table public.referrals enable row level security;
