import unittest,json
from pathlib import Path
from reference_engine import aggregate, workload_change, EXERCISES, MUSCLES, resolve

def event(id='a',parent='p1',exercise='fa-11',side='right',**extra):
    return dict(segment_id=id,session_id='s1',parent_bout_id=parent,
                exercise_id=exercise,side=side,state='completed',is_warmup=False,**extra)
def muscle(result,code):
    mid=next(m['id'] for m in MUSCLES.values() if m['code']==code)
    return next(m for m in result['muscles'] if m['muscle_id']==mid and m['side']=='right')

class DataTests(unittest.TestCase):
    def test_all_candidates_and_cells(self):
        self.assertEqual(set(range(1,51)),{e['original_candidate_number'] for e in EXERCISES.values()})
        self.assertEqual(len(EXERCISES),57)
        self.assertEqual(len(MUSCLES),19)
        self.assertEqual(sum(len(e['mappings']) for e in EXERCISES.values()),1083)
        sources={s['id'] for s in json.loads((Path(__file__).parent/'sources.json').read_text())}
        for e in EXERCISES.values():
            self.assertEqual({m['muscle_id'] for m in e['mappings']},set(MUSCLES))
            self.assertTrue(set(e['source_ids'])<=sources)
            self.assertIsNone(e['measured_activation_percent'])
            self.assertIsNone(e['validated_tendon_risk_percent'])
            for m in e['mappings']:
                g=m['targeting_grade_0_4']
                self.assertIn(g,[None,0,1,2,3,4])
                self.assertEqual(m['targeting_index_0_100'],None if g is None else 25*g)
                if g is None:self.assertEqual(m['exposure_bucket'],'unmodeled')
    def test_blocked_protocols(self):
        blocked={e['original_candidate_number'] for e in EXERCISES.values() if e['publication_status']=='blocked_protocol'}
        self.assertEqual(blocked,{7,10,13,27,39,40})
        r=aggregate([event(exercise='fa-07')],allow_draft=True)
        self.assertEqual(r['muscles'],[])
        self.assertEqual(r['unresolved_limb_bouts'],1)
    def test_alias(self):self.assertEqual(resolve('fa-22')['id'],'fa-12')
    def test_drafts_blocked_by_default(self):
        with self.assertRaises(ValueError):aggregate([event()])
    def test_drop_parent_and_dedup(self):
        es=[event(id=str(i),reps=reps,load=kg) for i,(reps,kg) in enumerate([(5,100),(6,70),(10,50)])]
        r=aggregate(es+[es[0]],allow_draft=True)
        self.assertEqual(muscle(r,'FCR')['counts']['direct_dynamic'],1)
        self.assertEqual(r['reps_by_parent'][0]['known_reps'],21)
    def test_conflicting_revision_rejected(self):
        with self.assertRaises(ValueError):aggregate([event(reps=5),event(reps=6)],allow_draft=True)
    def test_swap_requires_new_parent(self):
        with self.assertRaises(ValueError):aggregate([event(),event(id='b',exercise='fa-12')],allow_draft=True)
        r=aggregate([event(),event(id='b',parent='p2',exercise='fa-12')],allow_draft=True)
        self.assertEqual(muscle(r,'FCR')['counts']['direct_dynamic'],1)
        self.assertEqual(muscle(r,'ECU')['counts']['direct_dynamic'],1)
    def test_two_curls_one_hold(self):
        r=aggregate([event(),event(id='b',parent='p2'),event(id='c',parent='p3',exercise='fa-33',hold_seconds=20)],allow_draft=True)
        self.assertEqual(muscle(r,'FCR')['counts']['direct_dynamic'],2)
        self.assertEqual(muscle(r,'FCR')['counts']['supporting_isometric'],1)
        self.assertEqual(muscle(r,'FDP')['known_deliberate_hold_seconds'],20)
        self.assertEqual(muscle(r,'FDP')['counts']['supporting_dynamic'],2)
        self.assertFalse(any(m['muscle_id']=='brachioradialis' for m in r['muscles']))
        medial=next(t for t in r['tissue_regions'] if t['region']=='medial-flexor-origin')
        self.assertEqual(medial['working_parent_bouts'],3)
    def test_missing_hold_not_assumed(self):
        r=aggregate([event(exercise='fa-41')],allow_draft=True)
        m=muscle(r,'FDP')
        self.assertEqual(m['known_deliberate_hold_seconds'],0)
        self.assertEqual(m['segments_missing_hold_duration'],1)
    def test_bilateral_once_per_side(self):
        r=aggregate([event(side='bilateral')],allow_draft=True)
        rows=[m for m in r['muscles'] if m['muscle_id']=='flexor-carpi-radialis']
        self.assertEqual(len(rows),2)
        self.assertTrue(all(m['counts']['direct_dynamic']==1 for m in rows))
    def test_assisted_unresolved(self):
        r=aggregate([event(exercise='fa-09',grip_assisted=True)],allow_draft=True)
        self.assertEqual(r['unresolved_limb_bouts'],1)
        self.assertEqual(r['muscles'],[])
    def test_warmup_separate(self):
        e=event();e['is_warmup']=True
        r=aggregate([e],allow_draft=True)
        self.assertEqual(r['muscles'],[])
        self.assertTrue(r['warmup_only_regions'])
    def test_planned_not_completed(self):
        e=event();e['state']='planned'
        self.assertEqual(aggregate([e],allow_draft=True)['muscles'],[])
        self.assertTrue(aggregate([e],mode='planned',allow_draft=True)['muscles'])
    def test_no_accidental_thumb_extension_credit(self):
        r=aggregate([event(),event(id='b',parent='p2',exercise='fa-14'),event(id='c',parent='p3',exercise='fa-33')],allow_draft=True)
        ids={m['muscle_id'] for m in r['muscles']}
        self.assertTrue(ids.isdisjoint({'extensor-pollicis-longus','extensor-pollicis-brevis','abductor-pollicis-longus'}))
    def test_invalid_metrics(self):
        for value in [-1,float('nan'),float('inf'),'20',True]:
            with self.assertRaises(ValueError):aggregate([event(hold_seconds=value)],allow_draft=True)
    def test_workload_baseline(self):
        self.assertEqual(workload_change(8,[5,5,5,5])['percent_change'],60)
        self.assertIsNone(workload_change(8,[0,0,0])['percent_change'])
        self.assertEqual(workload_change(8,[1,2])['state'],'building_baseline')
        self.assertIsNone(workload_change(8,[5,5,5])['injury_probability'])
        with self.assertRaises(ValueError):workload_change(8,[None,5,5])

if __name__=='__main__':unittest.main()
