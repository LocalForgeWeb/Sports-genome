# Draft 11 §3.4 step 3 ("evened out muscle by muscle"), simulated on plan A's movement structure.
# Movements and the target muscles each credits directly (v1, reviewed rows, forearm-v1-mappings).
movements = [  # region order
 ("elbow flexion (Hammer Curl, plan's own)", ["BR"]),
 ("wrist flexion", ["FCR","FCU"]),
 ("wrist extension", ["ECRL","ECRB","ECU"]),
 ("radial deviation", ["FCR","ECRL","ECRB"]),
 ("ulnar deviation", ["FCU","ECU"]),
 ("pronation", ["PT","PQ"]),
 ("supination", ["SUP"]),
 ("finger flexion", ["FDS","FDP"]),
 ("finger extension", ["ED"]),
 ("thumb flexion", ["FPL"]),
 ("thumb extension", ["EPL","EPB"]),
 ("thumb abduction", ["APL"]),
]
CAP = 6  # 3 a session x 2 sessions a week
def run(total):
    sets = {m:0 for m,_ in movements}
    sets[movements[0][0]] = 3  # plan's own Hammer Curl 3 sets; the stack never adds to the plan's own movement here
    for m,_ in movements[1:]: sets[m] = 1  # step 2: one set per uncovered movement
    def per_muscle():
        c = {}
        for m,ms in movements:
            for x in ms: c[x] = c.get(x,0)+sets[m]
        return c
    added = sum(sets.values())
    while added < total:
        c = per_muscle()
        best = None
        for i,(m,ms) in enumerate(movements[1:],1):
            if sets[m] >= CAP: continue
            least = min(c[x] for x in ms)
            reach = sum(1 for x in ms if c[x]==least)
            key = (least, -reach, i)
            if best is None or key < best[0]: best = (key, m)
        if best is None: break
        sets[best[1]] += 1; added += 1
    return sets, per_muscle()
for total in (14, 20, 30, 40):
    s,c = run(total)
    print(f"total {total}: " + "; ".join(f"{m} {n}" for m,n in s.items()))
    print("   per muscle: " + " ".join(f"{k}={v}" for k,v in sorted(c.items())))
