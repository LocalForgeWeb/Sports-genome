-- Make the server-only read contract explicit in Supabase policy metadata.
-- Browser roles remain denied and the service role retains its server adapter path.
create policy "service role reads evidence coverage"
on public.exercise_evidence_coverage
for select
to service_role
using (true);
