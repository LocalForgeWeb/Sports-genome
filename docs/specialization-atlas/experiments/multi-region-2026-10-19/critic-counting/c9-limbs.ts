import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
const show = (re: RegExp) => exercises.filter((e) => re.test(e.name)).map((e) => `${e.id} ${e.name} [${e.equipment ?? ""}] q=${(e as any).qualities ?? ""}`);
console.log("hands-free candidates:", show(/Leg Press|Leg Extension|Leg Curl|Back Extension|Hyperextension|Hip Thrust Machine|Belt Squat|Nordic|Glute-Ham|Adductor Machine|Abductor Machine|Seated Calf/i).join("; "));
console.log("one leg, maybe one hand:", show(/Single-Leg|One-Leg|Single Leg|Split Squat|Step-Up|Lunge|Pistol|Copenhagen|Side Plank|Suitcase/i).join("; "));
