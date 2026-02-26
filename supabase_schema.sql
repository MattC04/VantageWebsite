create extension if not exists "pgcrypto";

create table if not exists public.waitlist_users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  status            text not null default 'VERIFIED'
                    check (status in ('VERIFIED','BOUNCED','UNSUBSCRIBED')),
  created_at        timestamptz not null default now(),
  verified_at       timestamptz,
  app_user_id       uuid,
  ip_first          text,
  user_agent_first  text
);

create table if not exists public.squads (
  id                      uuid primary key default gen_random_uuid(),
  owner_waitlist_user_id  uuid not null unique references public.waitlist_users(id) on delete cascade,
  share_code              text not null unique,
  created_at              timestamptz not null default now()
);

create table if not exists public.referrals (
  id                          uuid primary key default gen_random_uuid(),
  squad_id                    uuid not null references public.squads(id) on delete cascade,
  inviter_waitlist_user_id    uuid not null references public.waitlist_users(id) on delete cascade,
  invitee_waitlist_user_id    uuid not null unique references public.waitlist_users(id) on delete cascade,
  status                      text not null default 'VERIFIED'
                              check (status in ('VERIFIED','ACTIVATED','DISQUALIFIED')),
  created_at                  timestamptz not null default now(),
  verified_at                 timestamptz,
  constraint no_self_referral check (inviter_waitlist_user_id <> invitee_waitlist_user_id)
);

create table if not exists public.reward_tiers (
  tier_number        int primary key,
  required_verified  int not null,
  reward_title       text not null,
  reward_description text not null
);

insert into public.reward_tiers (tier_number, required_verified, reward_title, reward_description)
values
  (1, 2, 'Free Credits',      'Free credits to bet with at launch.'),
  (2, 4, 'Exclusive Cards',   'Exclusive player cards + squad room access.'),
  (3, 6, 'Daily Drop Access', 'Massive promos & drops every day.'),
  (4, 8, 'Founding Member',   'Founding member status + lifetime perks.')
on conflict (tier_number) do nothing;

create table if not exists public.reward_unlocks (
  id                uuid primary key default gen_random_uuid(),
  waitlist_user_id  uuid not null references public.waitlist_users(id) on delete cascade,
  tier_number       int not null references public.reward_tiers(tier_number),
  status            text not null default 'UNLOCKED'
                    check (status in ('UNLOCKED','PAID','REVOKED')),
  unlocked_at       timestamptz,
  unique (waitlist_user_id, tier_number)
);

create index if not exists idx_waitlist_users_email   on public.waitlist_users(email);
create index if not exists idx_squads_share_code      on public.squads(share_code);
create index if not exists idx_referrals_inviter      on public.referrals(inviter_waitlist_user_id);
create index if not exists idx_referrals_squad        on public.referrals(squad_id);
create index if not exists idx_reward_unlocks_user    on public.reward_unlocks(waitlist_user_id);

alter table public.waitlist_users  enable row level security;
alter table public.squads          enable row level security;
alter table public.referrals       enable row level security;
alter table public.reward_tiers    enable row level security;
alter table public.reward_unlocks  enable row level security;

create policy "reward_tiers_public_read"
  on public.reward_tiers for select
  to anon
  using (true);
