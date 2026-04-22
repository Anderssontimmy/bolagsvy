-- Companies synced from Bolagsverket
create table companies (
  id uuid primary key default gen_random_uuid(),
  org_number text unique not null,
  name text not null,
  status text not null default 'active',
  address text,
  city text,
  county text,
  sni_code text,
  sni_description text,
  registered_at date,
  board_members jsonb default '[]',
  slug text unique not null,
  last_synced_at timestamptz default now(),
  created_at timestamptz default now()
);

create index on companies (slug);
create index on companies (sni_code);
create index on companies (city);
create index on companies (status);

-- Tracks which companies each Pro user is watching
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, company_id)
);

-- Diffs detected during nightly sync — used for weekly digest
create table company_changes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  change_type text not null, -- 'board_change' | 'address_change' | 'status_change'
  old_value jsonb,
  new_value jsonb,
  detected_at timestamptz default now()
);

-- Stripe subscription state per user
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free',
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

-- RLS: users can only read their own watchlist and subscription
alter table watchlist enable row level security;
alter table subscriptions enable row level security;

create policy "Users see own watchlist" on watchlist
  for all using (auth.uid() = user_id);

create policy "Users see own subscription" on subscriptions
  for all using (auth.uid() = user_id);

-- Companies and changes are public read
alter table companies enable row level security;
create policy "Public read companies" on companies for select using (true);

alter table company_changes enable row level security;
create policy "Public read changes" on company_changes for select using (true);
