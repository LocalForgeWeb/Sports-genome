import { ArrowUpRight, Compass } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";
import type { SportContextMode } from "@shared/resilienceContext";

/**
 * Stands in for a sport-derived workspace when the athlete has not chosen a sport.
 *
 * The sport-optional contract gates sport-derived output without blocking general training:
 * demands, transfer claims and sport comparisons need a real sport to mean anything, so this
 * says so and offers the one action that changes it. It never presents a default sport, and it
 * never treats "no sport" as an error the athlete has to fix.
 */
export function SportContextGate({ mode, workspaceLabel, sports, onChooseSport, onBrowseCatalog }: {
  mode: SportContextMode;
  workspaceLabel: string;
  sports: SportProfile[];
  onChooseSport: (sportId: string) => void;
  onBrowseCatalog: () => void;
}) {
  return <section className="sport-context-gate" aria-label={`${workspaceLabel} needs a sport`}>
    <div className="sport-context-gate-head">
      <Compass className="h-5 w-5" />
      <div>
        <p className="metric-label">Sport context</p>
        <h2>{workspaceLabel} needs a sport to be about something</h2>
        <p>
          {mode === "general"
            ? "You are training for general strength and resilience, so there is no sport whose demands this could show. Everything else — your catalog, training days, Body Lab and progress — works exactly the same."
            : "You have not picked a sport yet. This workspace reads a sport's researched movement demands, so it stays empty rather than showing you one you did not choose."}
        </p>
      </div>
    </div>
    <div className="sport-context-gate-actions">
      <label>
        <span className="metric-label">Choose a sport to open it</span>
        <select defaultValue="" onChange={(event) => { if (event.target.value) onChooseSport(event.target.value); }}>
          <option value="" disabled>Select a sport</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}
        </select>
      </label>
      <button type="button" onClick={onBrowseCatalog}>Browse the exercise catalog instead <ArrowUpRight className="h-4 w-4" /></button>
    </div>
    <p className="sport-context-gate-note">Picking a sport here sets your training context to that sport. You can change it back from your profile at any time.</p>
  </section>;
}
