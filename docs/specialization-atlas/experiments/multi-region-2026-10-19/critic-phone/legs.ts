import { exercises } from "../../../../../../../home/user/Sports-genome/client/src/lib/exerciseCatalog";
const re = /split|lunge|step|single[- ]leg|one[- ]leg|pistol|copenhagen|cossack|skater|curtsy|lateral lunge|side plank|suitcase|single-arm|one-arm|unilateral/i;
for (const e of exercises as any[]) if (re.test(e.name)) console.log(e.id, "|", e.name, "|", (e.primaryMuscles||[]).join(","), "|", (e.secondaryMuscles||[]).join(","));
