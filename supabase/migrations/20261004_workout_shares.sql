-- Shared workouts: published snapshots of a training day or week (server/workoutShares.ts).
--
-- Reached only by the app's server with the service key. Row-level security is on and no
-- policy is granted, and anon/authenticated hold no privileges, so a browser key can neither
-- list nor read shares: a recipient reads one through the server, by its token, and gets the
-- approved snapshot only. The manage secret is stored as its SHA-256; the token is random
-- (128 bits) and is never a row id.
create table if not exists public.workout_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{20,64}$'),
  manage_hash text not null check (manage_hash ~ '^[0-9a-f]{64}$'),
  request_key text not null unique check (request_key ~ '^[A-Za-z0-9_-]{16,64}$'),
  schema_version integer not null check (schema_version >= 1),
  scope text not null check (scope in ('day', 'week')),
  title text not null check (char_length(title) between 1 and 80),
  payload jsonb not null check (pg_column_size(payload) <= 65536),
  exercise_count integer not null check (exercise_count between 1 and 210),
  day_count integer not null check (day_count between 1 and 7),
  version integer not null default 1 check (version >= 1),
  supersedes_token text references public.workout_shares (token) on delete set null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  disabled_at timestamptz,
  check ((status = 'disabled') = (disabled_at is not null))
);

comment on table public.workout_shares is 'Published workout snapshots behind share links. Server-only (service role); RLS on with no policies. Payload is the sender-approved snapshot; manage_hash is SHA-256 of the creating device''s secret.';

create index if not exists workout_shares_supersedes_idx on public.workout_shares (supersedes_token) where supersedes_token is not null;

alter table public.workout_shares enable row level security;
revoke all on public.workout_shares from anon, authenticated;
grant select, insert, update on public.workout_shares to service_role;
