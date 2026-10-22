import json, sys
pkg_dir, S = sys.argv[1], sys.argv[2]
ex = json.load(open(f"{pkg_dir}/exercises.json"))
mus = {m["id"]: m["code"] for m in json.load(open(f"{pkg_dir}/muscles.json"))}
app = json.load(open(f"{S}/app-mappings.json"))
code2node = {"BR":"forearm.br","FCR":"forearm.fcr","FCU":"forearm.fcu","PL":"forearm.pl","FDS":"forearm.fds","FDP":"forearm.fdp","FPL":"forearm.fpl","PT":"forearm.pt","PQ":"forearm.pq","ECRL":"forearm.ecrl","ECRB":"forearm.ecrb","ECU":"forearm.ecu","ED":"forearm.ed","EDM":"forearm.edm","EI":"forearm.ei","APL":"forearm.apl","EPB":"forearm.epb","EPL":"forearm.epl","SUP":"forearm.supinator"}
# package record -> (app catalog id or None, kind, note)
M = {
 "fa-01": (139, "same action, other set-up", "app 139 is kneeling, forearms on a bench (variants/forearm.ts:123); seated is the same wrist flexion"),
 "fa-02": (140, "same action, other set-up", "app 140 kneeling, palms down (variants/forearm.ts:124)"),
 "fa-03": (None, "new row", "behind-the-back standing wrist curl: no catalog row; would map as wristCurl()"),
 "fa-04": (135, "exact", "Reverse Curl, barbell, palms down (variants/forearm.ts:110)"),
 "fa-05": (None, "new row", "no reverse preacher curl; 126 Preacher Curl is supinated"),
 "fa-06": (None, "new row", "no two-hand barbell hold; 145 Farmer Hold is an implement in each hand, neutral (variants/forearm.ts:152)"),
 "fa-07": (None, "blocked; app rows resolve it", "the three readings are existing rows: 238 Barbell Rollout (abs), 141/415/416 Wrist Roller (by wind), 401 Finger Curl (bar rolled to the fingertips)"),
 "fa-08": (121, "modifier on an existing row", "Barbell Curl with a thick handle; no grip-diameter attribute exists; package itself forbids a multiplier"),
 "fa-09": (42, "modifier on an existing row", "Romanian Deadlift (42; twin 186) with a thick handle"),
 "fa-10": (None, "blocked; app rows resolve it", "pronated loaded roller = 415 Wrist Roller, Extension Wind; reverse wrist curl = 140; finger roll = 401"),
 "fa-11": (410, "exact", "One-Arm Dumbbell Wrist Curl (variants/forearm.ts:130); a two-dumbbell set has no row"),
 "fa-12": (411, "exact", "One-Arm Dumbbell Reverse Wrist Curl (variants/forearm.ts:131)"),
 "fa-13": (None, "blocked; app row resolves one reading", "if radial deviation is meant: 407 Lever Radial Deviation; a neutral-grip wrist flexion has no row"),
 "fa-14": (132, "exact", "Hammer Curl (variants/forearm.ts:107)"),
 "fa-15": (None, "new row", "no preacher hammer curl"),
 "fa-16": (136, "exact", "Zottman Curl; both decline to credit the turn (mappings.ts:259-264)"),
 "fa-17": (405, "exact", "Lever Pronation, elbow 90, palm-down against the lever (variants/forearm.ts:136); the package's direction fix is already in the app"),
 "fa-18": (406, "exact", "Lever Supination (variants/forearm.ts:137)"),
 "fa-19": (407, "exact", "Lever Radial Deviation, arm at side, weight in front (variants/forearm.ts:132)"),
 "fa-20": (408, "exact", "Lever Ulnar Deviation (variants/forearm.ts:133)"),
 "fa-21": (299, "modifier on an existing row", "Farmer's Walk with thick handles"),
 "fa-22": (411, "alias", "alias of fa-12, logged as 411"),
 "fa-23": (None, "new row", "no cable wrist flexion; 350 is extension only"),
 "fa-24": (350, "exact", "Cable Wrist Extension (variants/forearm.ts:129)"),
 "fa-25": (None, "new row", "no cable reverse curl (135 is free weight)"),
 "fa-26": (337, "exact", "Rope Hammer Cable Curl (also 134 Rope Hammer Curl, same set-up: variants/forearm.ts:109, 115)"),
 "fa-27": (None, "blocked; app row resolves one reading", "an elbow curl with the arm behind the body is 129 Bayesian Cable Curl (variants/forearm.ts:104)"),
 "fa-28": (332, "exact", "Rope Cable Row (variants/forearm.ts:185)"),
 "fa-29": (None, "new row", "no towel cable row (78 Towel Pull-Up is the towel pull)"),
 "fa-30": (405, "other equipment", "a pronation machine: same action as 405 but a stack load (machine_displayed_load); a separate row if adopted"),
 "fa-31": (406, "other equipment", "a supination machine vs 406 lever"),
 "fa-32-flexion": (None, "new row", "no wrist-flexion machine"),
 "fa-32-extension": (None, "new row", "no wrist-extension machine"),
 "fa-33": (409, "exact", "Suitcase Carry: one dumbbell or kettlebell in one hand (variants/forearm.ts:154)"),
 "fa-34": (None, "new row", "no bottoms-up press; kettlebell rows 387-390 are listed unmapped (unmapped.ts)"),
 "fa-35": (None, "new row", "no bottoms-up clean; 387 Kettlebell Clean is listed unmapped as ballistic"),
 "fa-36": (None, "new row", "no kettlebell hammer curl; 132's variant says two dumbbells"),
 "fa-37-flexion": (None, "new row", "no kettlebell wrist curl (410 is a dumbbell)"),
 "fa-37-extension": (None, "new row", "no kettlebell reverse wrist curl (411 is a dumbbell)"),
 "fa-38": (142, "exact", "Plate Pinch (variants/forearm.ts:149)"),
 "fa-39": (None, "blocked", "plate flips: no row"),
 "fa-40": (None, "blocked", "no row"),
 "fa-41": (143, "exact", "Dead Hang (variants/forearm.ts:150)"),
 "fa-42": (78, "exact", "Towel Pull-Up (variants/forearm.ts:207)"),
 "fa-43": (144, "exact", "Towel Dead Hang (variants/forearm.ts:151)"),
 "fa-44": (143, "modifier on an existing row", "Dead Hang on a thick bar"),
 "fa-45": (None, "new row", "no fingertip push-up"),
 "fa-46": (None, "new row", "no fingertip plank"),
 "fa-47": (402, "exact", "Gripper Close (variants/forearm.ts:141)"),
 "fa-48": (None, "new row", "no ball squeeze; 403 Gripper Hold is the sustained gripper squeeze"),
 "fa-49": (None, "new row", "no crab walk"),
 "fa-50-finger-close": (None, "new row", "no rice-bucket rows"),
 "fa-50-finger-open": (None, "new row", "same action as 404 Band Finger Extension, other resistance"),
 "fa-50-pronation": (None, "new row", ""),
 "fa-50-supination": (None, "new row", ""),
 "fa-50-wrist-flexion": (None, "new row", ""),
 "fa-50-wrist-extension": (None, "new row", ""),
}
eq = {"direct_dynamic":"direct_dynamic","supporting_dynamic":"contributing_dynamic","deliberate_isometric":"deliberate_isometric","supporting_isometric":"incidental_isometric","incidental_grip":"incidental_isometric"}
short = lambda c: {"direct_dynamic":"DD","contributing_dynamic":"CD","deliberate_isometric":"DH","incidental_isometric":"II","mixed":"MX","unknown":"UN"}[c]
lines = ["# Package records against the app catalog and forearm_mappings_v1", "", "Generated by reconcile.py from docs/specialization-atlas/forearm-research-v1/exercises.json and the app's mappings (app-mappings.json). Buckets compared as: direct_dynamic = DD; supporting_dynamic ~ contributing_dynamic (CD); deliberate_isometric = DH; supporting_isometric and incidental_grip ~ incidental_isometric (II, the app has one category for both: rules.ts:61). '*' = draft in v1 (not counted).", "",
 "| Package id | Package name | Status | App row | Match | Same in both | Package only | App only | Bucket differs | Note |", "|---|---|---|---|---|---|---|---|---|---|"]
stats = {}
for e in ex:
    cid, kind, note = M[e["id"]]
    stats[kind] = stats.get(kind, 0) + 1
    pk = {code2node[mus[m["muscle_id"]]]: eq[m["exposure_bucket"]] for m in e["mappings"] if m["targeting_grade_0_4"] not in (None, 0)}
    same = pko = appo = differ = ""
    appname = ""
    if cid is not None:
        am = [m for m in app if m["catalogId"] == cid and m["nodeId"].startswith("forearm.")]
        appname = next((m["name"] for m in app if m["catalogId"] == cid), "")
        a = {m["nodeId"]: (m["category"], m["status"]) for m in am}
        s, po, ao, d = [], [], [], []
        for n in sorted(set(pk) | set(a)):
            nm = n.replace("forearm.", "").upper().replace("SUPINATOR", "SUP")
            if n in pk and n in a:
                (s if pk[n] == a[n][0] else d).append(nm + ("" if pk[n] == a[n][0] else f" pkg {short(pk[n])} / app {short(a[n][0])}") + ("*" if a[n][1] != "reviewed" else ""))
            elif n in pk: po.append(f"{nm} {short(pk[n])}")
            else: ao.append(f"{nm} {short(a[n][0])}" + ("*" if a[n][1] != "reviewed" else ""))
        same, pko, appo, differ = ", ".join(s), ", ".join(po), ", ".join(ao), ", ".join(d)
    lines.append(f"| {e['id']} | {e['name']} | {e['publication_status']} | {str(cid)+' '+appname if cid else '—'} | {kind} | {same} | {pko} | {appo} | {differ} | {note} |")
lines += ["", "Counts by match kind: " + "; ".join(f"{k}: {v}" for k, v in sorted(stats.items()))]
open(f"{S}/package-vs-app-exercises.md", "w").write("\n".join(lines) + "\n")
print("\n".join(lines[-1:]))
