-- Infrastructure V2 (RL02): one rate-limit allowance shared by every server instance.
--
-- The server's in-memory limits (server/_core/rateLimit.ts) count per function instance, so
-- cold starts and parallel instances each grant a fresh allowance. This keeps one fixed-window
-- counter per (bucket, window) row; INSERT ... ON CONFLICT DO UPDATE takes the row lock, so
-- concurrent calls from any number of instances serialize on it and none is lost.
--
-- Buckets are "<scope>:<HMAC of the client address>" computed by the server: no address is
-- stored. Rows older than two hours are deleted in small batches as calls arrive, so the
-- table stays bounded by recent traffic. Only the service role may call the function.
--
-- Additive and reversible: rollback is
--   drop function if exists public.sg_rate_limit_hit(text, integer, integer);
--   drop table if exists private.rate_limit_windows;
-- The server treats a missing function as "shared limit unavailable" and keeps its local limit.

create schema if not exists private;

create table if not exists private.rate_limit_windows (
  bucket text not null check (length(bucket) between 1 and 200),
  window_start timestamptz not null,
  calls integer not null default 0 check (calls >= 0),
  primary key (bucket, window_start)
);

alter table private.rate_limit_windows enable row level security;
revoke all on table private.rate_limit_windows from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on table private.rate_limit_windows from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on table private.rate_limit_windows from authenticated'; end if;
end $$;

create index if not exists rate_limit_windows_window_start_idx on private.rate_limit_windows (window_start);

create or replace function public.sg_rate_limit_hit(p_bucket text, p_window_seconds integer, p_max_calls integer)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_calls integer;
begin
  if p_bucket is null or length(p_bucket) not between 1 and 200
     or p_window_seconds is null or p_window_seconds not between 1 and 3600
     or p_max_calls is null or p_max_calls not between 1 and 100000 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  v_start := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);

  insert into private.rate_limit_windows as w (bucket, window_start, calls)
  values (p_bucket, v_start, 1)
  on conflict (bucket, window_start) do update set calls = w.calls + 1
  returning w.calls into v_calls;

  -- Bounded housekeeping on roughly one call in fifty.
  if random() < 0.02 then
    delete from private.rate_limit_windows
    where ctid in (
      select ctid from private.rate_limit_windows
      where window_start < clock_timestamp() - interval '2 hours'
      limit 500
    );
  end if;

  return jsonb_build_object(
    'allowed', v_calls <= p_max_calls,
    'calls', v_calls,
    'retry_after_seconds', case when v_calls <= p_max_calls then 0
      else greatest(1, ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds) - clock_timestamp())))::integer) end
  );
end
$$;

revoke all on function public.sg_rate_limit_hit(text, integer, integer) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on function public.sg_rate_limit_hit(text, integer, integer) from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on function public.sg_rate_limit_hit(text, integer, integer) from authenticated'; end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then execute 'grant execute on function public.sg_rate_limit_hit(text, integer, integer) to service_role'; end if;
end $$;

comment on function public.sg_rate_limit_hit(text, integer, integer) is
  'Infrastructure V2 shared rate limit: one fixed-window counter per bucket, shared by every server instance. Service role only.';
