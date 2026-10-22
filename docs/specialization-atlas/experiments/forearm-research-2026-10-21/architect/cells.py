import json, sys
recs = json.load(open(sys.argv[1]))
ab = {"brachioradialis":"BR","flexor-carpi-radialis":"FCR","flexor-carpi-ulnaris":"FCU","palmaris-longus":"PL","flexor-digitorum-superficialis":"FDS","flexor-digitorum-profundus":"FDP","flexor-pollicis-longus":"FPL","pronator-teres":"PT","pronator-quadratus":"PQ","extensor-carpi-radialis-longus":"ECRL","extensor-carpi-radialis-brevis":"ECRB","extensor-carpi-ulnaris":"ECU","extensor-digitorum":"ED","extensor-digiti-minimi":"EDM","extensor-indicis":"EI","abductor-pollicis-longus":"APL","extensor-pollicis-brevis":"EPB","extensor-pollicis-longus":"EPL","supinator":"SUP"}
want = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
for r in recs:
    if want and r["id"] not in want:
        continue
    cells = []
    for m in r["mappings"]:
        g = m["targeting_grade_0_4"]
        if g is None:
            continue
        cells.append("%s:%s%s" % (ab.get(m["muscle_id"], m["muscle_id"]), g, m["exposure_bucket"][:8]))
    print(r["id"], r["name"], "|", r["profile_id"], "|", r["prescription_profile_id"], "|", r["source_ids"], "|", " ".join(cells))
    print("   setup:", (r.get("setup_definition") or "")[:260])
    print("   flags:", r["context_flags"], "| req:", r["required_context"])
