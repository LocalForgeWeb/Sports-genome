-- Sports Genome server-only evidence adapter reads this table with the
-- service-role key. Browser clients receive only narrow tRPC response shapes.
-- Do not add a public policy without a deliberate data-publication review.
alter table public.exercise_evidence_coverage enable row level security;

revoke all on table public.exercise_evidence_coverage from anon, authenticated;

create policy "service role reads evidence coverage"
on public.exercise_evidence_coverage
for select
to service_role
using (true);
