import json, sys
from collections import Counter
base = json.load(open(sys.argv[1])); other = json.load(open(sys.argv[2]))
fields = "direct/contribDyn/holdBouts/holdSec/incidental/mixed/unknown/pending/unknownSide/coverage".split("/")
changed_cases = 0; node_changes = Counter(); field_changes = Counter(); examples = {}
top = Counter()
for case, a in base.items():
    b = other[case]; diff = False
    for k in ("regionDistinctBouts", "regionUnknownSideBouts", "completeness", "goals"):
        if a[k] != b[k]:
            top[k] += 1; diff = True
            examples.setdefault(k, (case, a[k], b[k]))
    for node, va in a["nodes"].items():
        vb = b["nodes"].get(node)
        if va != vb:
            diff = True; node_changes[node] += 1
            for f, x, y in zip(fields, va.split("/"), (vb or "").split("/")):
                if x != y: field_changes[(node, f)] += 1; examples.setdefault((node, f), (case, x, y))
    changed_cases += diff
print("cases", len(base), "changed (besides version key)", changed_cases)
print("top-level fields changed:", dict(top))
for k, v in examples.items():
    if isinstance(k, str): print("  e.g.", k, v[0], "\n    v1:", v[1], "\n    v2:", v[2])
print("node fields changed (cases):")
for (node, f), n in sorted(field_changes.items()): print(f"  {node:24s} {f:12s} {n:3d}  e.g. {examples[(node,f)]}")
