"""Runs the owner's package reference engine and its tests from a path, without importing from cwd.
Usage: python3 -I run_reference_engine.py <package dir>"""
import importlib.util, sys, json, unittest
pkg = sys.argv[1]
def load(name):
    spec = importlib.util.spec_from_file_location(name, f"{pkg}/{name}.py")
    mod = importlib.util.module_from_spec(spec); sys.modules[name] = mod; spec.loader.exec_module(mod); return mod
ref = load("reference_engine")
events = json.load(open(f"{pkg}/example-events.json"))
r = ref.aggregate(events, allow_draft=True)
print("example-events.json -> tissue_regions:")
for t in r["tissue_regions"]:
    if not t["region"].endswith("musculotendinous-unit"): print("  ", t)
print("limb_bouts", r["limb_bouts"], "unresolved", r["unresolved_limb_bouts"], "reps_by_parent", r["reps_by_parent"])
for row in r["muscles"]:
    if row["muscle_id"] in ("flexor-carpi-radialis","flexor-digitorum-profundus","flexor-pollicis-longus"): print("  ", row["muscle_id"], row["counts"], "hold s", row["known_deliberate_hold_seconds"])
print("workload_change(8,[5,5,5,5]) =", ref.workload_change(8,[5,5,5,5]))
print("workload_change(8,[0,0,0]) =", ref.workload_change(8,[0,0,0]))
print("workload_change(8,[1,2]) =", ref.workload_change(8,[1,2]))
print("workload_change(9,[16,16,9,16,30]) uses last 4 only =", ref.workload_change(9,[30,16,16,9,16]))
tests = load("test_model")
suite = unittest.defaultTestLoader.loadTestsFromModule(tests)
res = unittest.TextTestRunner(verbosity=0).run(suite)
print("tests run", res.testsRun, "failures", len(res.failures), "errors", len(res.errors))
