-- Backend V1 (SB-07; B179, B181, B194). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- anon and authenticated held INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on tables whose
-- only policy is SELECT, and anon held TRUNCATE on user tables - TRUNCATE is not subject to RLS.
-- RLS was the only barrier, and a new table created without it would be fully writable by anon.
--
-- 1. TRUNCATE, REFERENCES and TRIGGER are revoked from anon and authenticated on every table.
-- 2. For every table and each of INSERT, UPDATE, DELETE: the privilege is revoked from a role
--    that has no policy for that command. A policy granted to that role (or to PUBLIC) keeps it.
-- 3. New tables grant anon and authenticated nothing until a migration grants what they need.

do $$
declare
  t record;
  v_role text;
  v_cmd text;
  has_policy boolean;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.relname);
    foreach v_role in array array['anon', 'authenticated'] loop
      foreach v_cmd in array array['INSERT', 'UPDATE', 'DELETE'] loop
        select exists (
          select 1 from pg_policies p
          where p.schemaname = 'public' and p.tablename = t.relname
            and (p.cmd = v_cmd or p.cmd = 'ALL')
            and (v_role = any (p.roles) or 'public' = any (p.roles))
        ) into has_policy;
        if not has_policy then
          execute format('revoke %s on public.%I from %I', v_cmd, t.relname, v_role);
        end if;
      end loop;
    end loop;
  end loop;
end
$$;

alter default privileges in schema public revoke all on tables from anon, authenticated;
