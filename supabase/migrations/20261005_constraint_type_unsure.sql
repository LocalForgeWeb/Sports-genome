-- "Not sure" as its own reported state (intro quiz clarity, Oct 5).
--
-- The question "How is your <area> feeling?" now offers Not sure. It is stored as what it is,
-- 'unsure', rather than folded into "nothing going on" (which would read an uncertain answer
-- as fine) or into "bothering me now" (which would put words in the athlete's mouth). The
-- client treats it like any reported constraint: the plan is not adjusted automatically, and
-- the red-flag check that follows still applies. Existing values keep their meaning.
alter table public.athlete_training_constraints
  drop constraint if exists athlete_training_constraints_constraint_type_check;
alter table public.athlete_training_constraints
  add constraint athlete_training_constraints_constraint_type_check
  check (constraint_type in ('proactive_none','symptomatic','recent_or_returning','prior_recurrent','clinician_restricted','unsure'));
