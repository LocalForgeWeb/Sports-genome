"""Reference semantics, not a production service or clinically validated model.

Call only with events already filtered to the intended user/date range. The
production adapter must enforce identity, authorization and model approval.
Load JSON beside this module. No third-party Python packages required.
"""
from pathlib import Path
import json
from collections import defaultdict
from statistics import median

ROOT = Path(__file__).parent
EXERCISES = {e['id']: e for e in json.loads((ROOT/'exercises.json').read_text())}
MUSCLES = {m['id']: m for m in json.loads((ROOT/'muscles.json').read_text())}
BUCKETS = ('direct_dynamic', 'supporting_dynamic', 'deliberate_isometric',
           'supporting_isometric', 'incidental_grip')

def resolve(exercise_id):
    seen = set()
    while True:
        if exercise_id in seen:
            raise ValueError('Alias cycle')
        seen.add(exercise_id)
        e = EXERCISES[exercise_id]
        if not e.get('canonical_alias_of'):
            return e
        exercise_id = e['canonical_alias_of']

def nonnegative_number(value, field):
    if value is None:
        return
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f'{field} must be numeric or null')
    if not (0 <= value < float('inf')):
        raise ValueError(f'{field} must be finite and nonnegative')

def aggregate(events, mode='completed', allow_draft=False):
    """Distinct parent-bout counts; time remains time, no injury probability.

    Required event fields: segment_id, session_id, parent_bout_id, exercise_id,
    side ('left'/'right'/'bilateral'), state ('completed'/'planned'), is_warmup.
    Optional reps, hold_seconds, load, unit, grip_assisted.
    A parent is one exercise bout, not a whole superset/circuit container.
    Drop segments share the parent ID; exercise swaps get a new parent ID.
    """
    if mode not in ('completed', 'planned'):
        raise ValueError('Invalid mode')
    unique = {}
    for event in events:
        for key in ('segment_id','session_id','parent_bout_id','exercise_id','side','state','is_warmup'):
            if key not in event:
                raise ValueError(f'Missing {key}')
        if event['side'] not in ('left','right','bilateral'):
            raise ValueError('Unknown side must be resolved, not treated as bilateral')
        if event['state'] not in ('completed','planned'):
            raise ValueError('Unsupported event state; filter cancelled/deleted records upstream')
        if not isinstance(event['is_warmup'],bool):
            raise ValueError('is_warmup must be boolean')
        for field in ('reps','hold_seconds','load'):
            nonnegative_number(event.get(field),field)
        key = (event['session_id'], event['segment_id'])
        if key in unique and unique[key] != event:
            raise ValueError('Conflicting duplicate segment; reconcile event revisions upstream')
        unique[key] = event

    parents = {}
    ledger = defaultdict(lambda: {b: set() for b in BUCKETS})
    times = defaultdict(float)
    missing_times = defaultdict(set)
    tissue = defaultdict(set)
    warmup_tissue = defaultdict(set)
    unresolved = set()
    all_bouts = set()
    reps_by_bout = defaultdict(float)
    for event in unique.values():
        if event['state'] != mode:
            continue
        parent = (event['session_id'], event['parent_bout_id'])
        e = resolve(event['exercise_id'])
        canonical = e['id']
        identity = (canonical,event['side'],event['is_warmup'])
        if parent in parents and parents[parent] != identity:
            raise ValueError('Parent mixes exercises, sides or warm-up/work status; split it')
        parents[parent] = identity
        if event.get('reps') is not None:
            reps_by_bout[parent] += event['reps']
        sides = ('left','right') if event['side']=='bilateral' else (event['side'],)
        for side in sides:
            p = (*parent,side)
            all_bouts.add(p)
            if e['publication_status']=='blocked_protocol' or event.get('grip_assisted'):
                unresolved.add(p)
                continue
            if e['publication_status'] != 'approved' and not allow_draft:
                raise ValueError('Draft mapping cannot run in production mode')
            any_mapped = False
            for m in e['mappings']:
                grade = m['targeting_grade_0_4']
                bucket = m['exposure_bucket']
                if grade is None or grade == 0 or bucket not in BUCKETS:
                    continue
                any_mapped = True
                mid = m['muscle_id']
                info = MUSCLES[mid]
                # A shared region receives a bout once, not once per muscle.
                for region in info['tissue_units']+info['regional_groups']:
                    (warmup_tissue if event['is_warmup'] else tissue)[(side,region)].add(p)
                if event['is_warmup']:
                    continue
                ledger[(side,mid)][bucket].add(p)
                if bucket=='deliberate_isometric':
                    if event.get('hold_seconds') is None:
                        missing_times[(side,mid)].add((event['session_id'],event['segment_id']))
                    else:
                        times[(side,mid)] += event['hold_seconds']
            if not any_mapped:
                unresolved.add(p)
    rows=[]
    for (side,mid),buckets in sorted(ledger.items()):
        rows.append(dict(side=side,muscle_id=mid,
            counts={b:len(v) for b,v in buckets.items()},
            supporting_union_bouts=len(buckets['supporting_dynamic'] | buckets['supporting_isometric']),
            known_deliberate_hold_seconds=times[(side,mid)],
            segments_missing_hold_duration=len(missing_times[(side,mid)]),
            biological_confidence='heuristic',injury_probability=None))
    return dict(muscles=rows,
        tissue_regions=[dict(side=s,region=r,working_parent_bouts=len(v),
                            warmup_parent_bouts=len(warmup_tissue[(s,r)]))
                        for (s,r),v in sorted(tissue.items())],
        warmup_only_regions=[dict(side=s,region=r,working_parent_bouts=0,warmup_parent_bouts=len(v))
                             for (s,r),v in sorted(warmup_tissue.items()) if (s,r) not in tissue],
        limb_bouts=len(all_bouts),unresolved_limb_bouts=len(unresolved),
        reps_by_parent=[dict(session_id=k[0],parent_bout_id=k[1],known_reps=v)
                        for k,v in sorted(reps_by_bout.items())],
        omitted_muscle_rows_mean='unmodeled or no mapped exposure; not measured physiological zero',
        injury_probability=None)

def workload_change(current, previous_complete_weeks):
    """Descriptive only. Caller guarantees matching metric/side/model/window.

    Complete-week status must be established upstream; empty logs are not proof
    of completeness. This helper never labels a ratio safe or unsafe.
    """
    nonnegative_number(current,'current')
    if current is None:
        return {'state':'missing_current','injury_probability':None}
    for x in previous_complete_weeks:
        nonnegative_number(x,'baseline')
        if x is None:
            raise ValueError('Unknown week is not a complete baseline week')
    if len(previous_complete_weeks)<3:
        return {'state':'building_baseline','injury_probability':None}
    baseline = median(previous_complete_weeks[-4:])
    return dict(state='new_exposure' if baseline==0 and current>0 else 'comparison',
                current=current,baseline_median=baseline,absolute_change=current-baseline,
                percent_change=None if baseline==0 else 100*(current-baseline)/baseline,
                injury_probability=None)
