import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { RegionBoutRow } from "@shared/specialization/types";
import { formatSegment } from "./model";

/** "Tue 13 Oct": the day a logged bout was done. Planned bouts have no date. */
export function boutDay(performedAt: string | null): string | null {
  return performedAt ? new Date(performedAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : null;
}

/**
 * One set record in a list of bouts (the movement sheet, the region's own totals): what it
 * was and when, its segments as logged, and "Open this workout" when it was a logged workout. No
 * side is named: both sides are counted as one (owner, 20 Oct 2026). The muscle sheet's ledger
 * draws its rows the same way.
 */
export function BoutItem({ row, title, meta, weightUnit, onOpenSession, children }: {
  row: RegionBoutRow;
  title: string;
  /** The line under the title; by default the workout and the day. */
  meta?: string;
  weightUnit: DisplayWeightUnit;
  onOpenSession: (sessionId: string) => void;
  children?: ReactNode;
}) {
  return <li className="spz-bout">
    <div className="spz-bout-head">
      <b>{title}</b>
      <small>{meta ?? [row.sessionLabel, boutDay(row.performedAt)].filter(Boolean).join(" · ")}</small>
    </div>
    <ul className="spz-segments">{row.segments.map((segment, index) => <li key={segment.id}>{row.kind === "drop" ? `Drop ${index + 1}: ` : ""}{formatSegment(segment, weightUnit)}</li>)}</ul>
    {children}
    {row.sessionId && <button type="button" className="spz-link" onClick={() => onOpenSession(row.sessionId!)}>Open this workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
  </li>;
}
