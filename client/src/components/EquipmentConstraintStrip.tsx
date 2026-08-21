import { Dumbbell, Settings2 } from "lucide-react";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { equipmentProfileSummary } from "@/lib/equipmentProfile";

export function EquipmentConstraintStrip({ profile, onOpenProfile }: { profile: AthleteEquipmentProfile; onOpenProfile: () => void }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#d9e2ec] bg-[#f4f8fc] px-4 py-3 text-xs text-[#38516a]">
    <div className="flex min-w-0 items-start gap-2"><Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-[#e4512e]" /><p><strong className="font-bold text-[#173d69]">Automatic stack filter:</strong> {equipmentProfileSummary(profile)}</p></div>
    <button onClick={onOpenProfile} className="inline-flex shrink-0 items-center gap-1 border border-[#c4d4e5] bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#2d6cdf]"><Settings2 className="h-3.5 w-3.5" /> Edit equipment</button>
  </div>;
}
