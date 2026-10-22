"""Build the package-vs-shipped-forearm reconciliation table.

Usage: python3 -I reconcile.py <package dir> <recon dir> <out reconciliation.json>
Reads the package's exercises.json and muscles.json (data only), our dumped mappings and
variants (ours.json, written by dump-ours.ts), the catalog dump (catalog.json) and the
hand-written catalog matches (matches.json).
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

pkg_dir, recon_dir, out_path = map(Path, sys.argv[1:4])
exercises = json.loads((pkg_dir / "exercises.json").read_text())
muscles = json.loads((pkg_dir / "muscles.json").read_text())
ours = json.loads((recon_dir / "ours.json").read_text())
catalog = {e["id"]: e for e in json.loads((recon_dir / "catalog.json").read_text())}
matches = json.loads((recon_dir / "matches.json").read_text())

# Package muscle id -> our node id (regions/forearm/ids.ts:13-33), by anatomical name.
NODE = {
    "brachioradialis": "forearm.br", "flexor-carpi-radialis": "forearm.fcr", "flexor-carpi-ulnaris": "forearm.fcu",
    "palmaris-longus": "forearm.pl", "flexor-digitorum-superficialis": "forearm.fds", "flexor-digitorum-profundus": "forearm.fdp",
    "flexor-pollicis-longus": "forearm.fpl", "pronator-teres": "forearm.pt", "pronator-quadratus": "forearm.pq",
    "extensor-carpi-radialis-longus": "forearm.ecrl", "extensor-carpi-radialis-brevis": "forearm.ecrb",
    "extensor-carpi-ulnaris": "forearm.ecu", "extensor-digitorum": "forearm.ed", "extensor-digiti-minimi": "forearm.edm",
    "extensor-indicis": "forearm.ei", "abductor-pollicis-longus": "forearm.apl", "extensor-pollicis-brevis": "forearm.epb",
    "extensor-pollicis-longus": "forearm.epl", "supinator": "forearm.supinator",
}
assert set(NODE) == {m["id"] for m in muscles}, "package muscle ids changed"

# The package's bucket, read as our counting category (rules.ts:50-62) and the relationship(s) it corresponds to.
BUCKET_TO_OURS = {
    "direct_dynamic": ("direct_dynamic", {"direct"}),
    "supporting_dynamic": ("contributing_dynamic", {"contributing"}),
    "deliberate_isometric": ("deliberate_isometric", {"direct"}),
    "supporting_isometric": ("incidental_isometric", {"stabilizer"}),
    "incidental_grip": ("incidental_isometric", {"incidental"}),
}
MODE = {"dynamic_concentric_eccentric": "dynamic", "isometric": "isometric"}

maps_by_variant = defaultdict(dict)
for m in ours["mappings"]:
    maps_by_variant[m["catalogId"]][m["nodeId"]] = m
variants = {v["catalogExerciseId"]: v for v in ours["variants"]}


def compare(cell, mine):
    grade = cell["targeting_grade_0_4"]
    if grade is None and mine is None:
        return "BOTH-UNMAPPED", None
    if grade is None:
        return "OURS-ONLY", f"we map {mine['relationship']} {mine['mode']} ({mine['category']}{', draft' if mine['status'] != 'reviewed' else ''}); package cell unmodeled"
    if mine is None:
        return "PACKAGE-ONLY", f"package grade {grade} {cell['exposure_bucket']}; we have no mapping for this muscle on this exercise"
    want_cat, want_rel = BUCKET_TO_OURS[cell["exposure_bucket"]]
    mode_ok = MODE[cell["contraction"]] == mine["mode"]
    cat_ok = want_cat == mine["category"]
    rel_ok = mine["relationship"] in want_rel
    draft = mine["status"] != "reviewed"
    tail = " Ours is a draft mapping: pending review, not counted." if draft else ""
    if cat_ok and rel_ok and mode_ok:
        return ("AGREE" + ("-DRAFT" if draft else "")), (tail.strip() or None)
    if cat_ok and mode_ok:
        return ("AGREE-CATEGORY" + ("-DRAFT" if draft else "")), (
            f"same counted category ({mine['category']}) but relationship differs: package {cell['exposure_bucket']} (grade {grade}) reads as {'/'.join(sorted(want_rel))}, ours is {mine['relationship']}.{tail}")
    return ("DISAGREE" + ("-DRAFT" if draft else "")), (
        f"package grade {grade} {cell['contraction']} {cell['exposure_bucket']} (= our {want_cat}); ours {mine['relationship']} {mine['mode']} = {mine['category']}.{tail}")


def compare_record(rec, catalog_id):
    rows = []
    mine_all = maps_by_variant.get(catalog_id, {})
    for cell in rec["mappings"]:
        node = NODE[cell["muscle_id"]]
        mine = mine_all.get(node)
        status, how = compare(cell, mine)
        rows.append({
            "packageMuscleId": cell["muscle_id"], "nodeId": node,
            "package": None if cell["targeting_grade_0_4"] is None else {
                "grade": cell["targeting_grade_0_4"], "contraction": cell["contraction"], "bucket": cell["exposure_bucket"],
                "band": cell["plausible_grade_band"], "confidence": cell["confidence"]},
            "ours": None if mine is None else {
                "mappingId": mine["id"], "actionId": mine["actionId"], "relationship": mine["relationship"], "mode": mine["mode"],
                "allocation": mine["allocation"], "requiresNoStraps": mine["requiresNoStraps"], "status": mine["status"],
                "category": mine["category"], "basis": mine["basis"], "sources": mine["sources"]},
            "status": status, "how": how,
        })
    outside = [
        {"nodeId": n, "relationship": m["relationship"], "mode": m["mode"], "category": m["category"], "status": m["status"]}
        for n, m in sorted(mine_all.items()) if not n.startswith("forearm.")
    ]
    return rows, outside


records = []
tally = Counter()
tally_by_record = {}
for rec in exercises:
    mt = matches[rec["id"]]
    entry = {
        "packageId": rec["id"], "originalCandidate": rec["original_candidate_number"], "name": rec["name"],
        "packageStatus": rec["publication_status"], "aliasOf": rec["canonical_alias_of"],
        "setup": rec["setup_definition"], "packageNotes": rec["notes"], "packageSources": rec["source_ids"],
        "contextFlags": rec["context_flags"],
        "catalogMatch": mt["match"], "catalogIds": mt["catalog"], "matchNote": mt["note"],
        "candidates": [],
    }
    for cid in mt["catalog"]:
        v = variants.get(cid)
        maps = maps_by_variant.get(cid, {})
        cand = {
            "catalogId": cid, "catalogName": catalog[cid]["name"], "equipment": catalog[cid]["equipment"],
            "movement": catalog[cid]["movement"],
            "variant": None if v is None else {
                "id": v["id"], "forearmOrientation": v["forearmOrientation"], "gripType": v["gripType"], "straps": v["straps"],
                "laterality": v["laterality"], "measure": v["measure"], "deliberateHold": v["deliberateHold"], "elbowAngleDeg": v["elbowAngleDeg"]},
            "mappingsReviewed": sum(1 for m in maps.values() if m["status"] == "reviewed"),
            "mappingsDraft": sum(1 for m in maps.values() if m["status"] == "draft"),
            "unmappedListed": any(u["catalogId"] == cid for u in ours["unmapped"]),
        }
        if maps and rec["publication_status"] == "blocked_protocol":
            cand["packageBlocked"] = "The package maps nothing until the protocol is resolved; our mappings of this candidate are listed, not compared."
            cand["ourMappings"] = [{"nodeId": n, "relationship": m["relationship"], "mode": m["mode"], "category": m["category"], "status": m["status"]} for n, m in sorted(maps.items())]
        elif maps:
            rows, outside = compare_record(rec, cid)
            cand["muscles"] = rows
            cand["oursOutsidePackageScope"] = outside
            c = Counter(r["status"] for r in rows)
            cand["statusCounts"] = dict(c)
            if cid == mt["catalog"][0] and rec["publication_status"] != "alias":
                tally.update(c)
                tally_by_record[rec["id"]] = dict(c)
        entry["candidates"].append(cand)
    nearest = mt.get("nearest", [])
    if mt["match"] == "none":
        entry["nearestFamily"] = nearest
        mapped_near = [n for n in nearest if n in maps_by_variant]
        if mapped_near and rec["publication_status"] == "draft_mapping":
            rows, outside = compare_record(rec, mapped_near[0])
            entry["analogComparison"] = {
                "against": mapped_near[0], "againstName": catalog[mapped_near[0]]["name"],
                "caution": "Analog only: the catalog has no such exercise. Shows whether the package's logic for this record agrees with our mapping of the nearest family; it is not a reconciliation of the same exercise.",
                "statusCounts": dict(Counter(r["status"] for r in rows)),
                "muscles": [r for r in rows if r["status"] != "BOTH-UNMAPPED"],
            }
    records.append(entry)

# Our variants that no package record matches.
matched_ids = {cid for e in records if e["packageStatus"] != "blocked_protocol" for cid in e["catalogIds"]}
ours_only_exercises = [
    {"catalogId": cid, "name": v["catalogName"],
     "mapped": sorted(n for n in maps_by_variant[cid])}
    for cid, v in sorted(variants.items()) if cid not in matched_ids
]

summary = {
    "records": len(records),
    "byCatalogMatch": dict(Counter(e["catalogMatch"] for e in records)),
    "blockedInPackage": [e["packageId"] for e in records if e["packageStatus"] == "blocked_protocol"],
    "recordsWithMappedCatalogExercise": sorted(tally_by_record),
    "cellStatusTotalsOverFirstCandidate": dict(tally),
    "oursOnlyExercises": len(ours_only_exercises),
}

out = {
    "generatedBy": str(Path(__file__).name),
    "packageVersion": "forearm-model-0.1.0-research-draft",
    "oursVersion": ours["version"],
    "repoHead": None,
    "vocabulary": {
        "muscleIdCrosswalk": NODE,
        "bucketToOurCategory": {k: {"category": v[0], "relationship": sorted(v[1])} for k, v in BUCKET_TO_OURS.items()},
        "statusKey": {
            "AGREE": "both map the muscle; the package bucket reads as our category and relationship, and the modes match",
            "AGREE-CATEGORY": "same counted category, different relationship word",
            "DISAGREE": "both map the muscle; categories differ",
            "PACKAGE-ONLY": "package grades the muscle; we have no mapping row",
            "OURS-ONLY": "we map the muscle; package cell is null (unmodeled)",
            "BOTH-UNMAPPED": "neither maps it",
            "-DRAFT suffix": "our mapping is draft: shown pending review, never counted (02-design.md:64)",
        },
    },
    "summary": summary,
    "records": records,
    "oursOnlyExercises": ours_only_exercises,
}
out_path.write_text(json.dumps(out, indent=1, ensure_ascii=False))
print(json.dumps(summary, indent=1))
for rid, c in tally_by_record.items():
    print(rid, c)
