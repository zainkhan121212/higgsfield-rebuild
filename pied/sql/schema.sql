-- Pied's tables live in their own schema, "pied". On Supabase that keeps them
-- out of the public schema the auto-generated REST API exposes, and row level
-- security is switched on with no policies, so the anon/authenticated keys
-- can't read or write a single row even if the schema were exposed. The
-- server connects as the database owner and does its own access checks.
-- Safe to run more than once.

create schema if not exists pied;

create table if not exists pied.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (length(email) between 3 and 254),
  password_hash text not null,
  display_name text not null default '' check (length(display_name) <= 60),
  email_verified_at timestamptz,
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Session ids and one-time tokens are stored as SHA-256 hashes: a leaked
-- table can't be replayed as cookies or links.
create table if not exists pied.sessions (
  id text primary key,
  user_id uuid not null references pied.users(id) on delete cascade,
  csrf text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user on pied.sessions(user_id);

create table if not exists pied.tokens (
  id text primary key,
  user_id uuid not null references pied.users(id) on delete cascade,
  kind text not null check (kind in ('verify', 'reset')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create index if not exists tokens_user on pied.tokens(user_id, kind);

create table if not exists pied.plates (
  id text primary key check (id ~ '^[A-Za-z0-9]{12}$'),
  user_id uuid not null references pied.users(id) on delete cascade,
  title text not null default 'Untitled' check (length(title) between 1 and 80),
  is_public boolean not null default false,
  cols int not null check (cols between 8 and 400),
  rows int not null check (rows between 8 and 400),
  data jsonb not null check (pg_column_size(data) <= 4000000),
  thumb bytea not null check (octet_length(thumb) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- A remix remembers the plate it was set from (the credit line on its share
-- page). If the original is deleted the credit goes too, the remix stays.
alter table pied.plates add column if not exists remix_of text references pied.plates(id) on delete set null;

create index if not exists plates_owner on pied.plates(user_id, created_at desc);
create index if not exists plates_public on pied.plates(created_at desc) where is_public;

-- Durable rate limits: shared by every server instance (serverless-safe).
create table if not exists pied.rate_limits (
  key text primary key,
  count int not null,
  reset_at timestamptz not null
);

create table if not exists pied.security_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  kind text not null,
  user_id uuid,
  who text not null default '',
  detail jsonb not null default '{}'
);
create index if not exists security_events_at on pied.security_events(at desc);

alter table pied.users enable row level security;
alter table pied.sessions enable row level security;
alter table pied.tokens enable row level security;
alter table pied.plates enable row level security;
alter table pied.rate_limits enable row level security;
alter table pied.security_events enable row level security;

-- Supabase's API roles get nothing in this schema.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema pied from anon, authenticated';
    execute 'revoke all on all tables in schema pied from anon, authenticated';
  end if;
end $$;
