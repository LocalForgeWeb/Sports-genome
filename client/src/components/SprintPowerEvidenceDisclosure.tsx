import { AlertTriangle, ChevronDown } from "lucide-react";
import type { SprintPowerEvidenceContext } from "@/lib/sprintPowerEvidence";

export function SprintPowerEvidenceDisclosure({ evidence, compact = false }: { evidence: SprintPowerEvidenceContext; compact?: boolean }) {
  return <details className="movement-disclosure" open={!compact}><summary>Verified sprint and power context <ChevronDown className="h-4 w-4" /></summary><div className="movement-caution"><AlertTriangle className="h-4 w-4" /><p><strong>{evidence.topics.join(" · ")}.</strong> {evidence.supportedUse}</p></div><div className="movement-sources"><span>Reviewed sources</span>{evidence.sourceLabels.map((source) => <small key={source}>{source}</small>)}</div><p className="mt-3 text-xs leading-5 text-[#607069]"><strong>Planning boundary:</strong> {evidence.planningBoundary}</p></details>;
}
