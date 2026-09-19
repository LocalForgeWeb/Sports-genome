import { useMemo, useState, useCallback } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
import { roleMapForLists, sourceValuesForRegion, viewsForRegion, regionPartName, type AnatomyRole } from "@/lib/anatomyRegions";
import { drawnMuscleKeys } from "@/components/anatomy/figureGeometry";
import { ChevronDown, ChevronRight, Focus, RotateCcw, RotateCw, Search, SlidersHorizontal, Target } from "lucide-react";
import { getAnatomyMechanicsEvidence } from "@/lib/anatomyMechanicsEvidence";
import type { BodyLabRoleDetail } from "@/lib/bodyLabRoleContext";
import "../anatomy-clean.css";

type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void; muscleScores?: Record<string, number>; roleDetails?: Record<string, BodyLabRoleDetail>; roleMethodology?: string; showInspector?: boolean };
type Role = "Primary" | "Synergist" | "Stabilizer";

// Categorical role states, never a magnitude. The Body Lab contract keeps
// exercise-target involvement on a dedicated categorical encoding rather than
// reusing a rank scale, so these three select colour and nothing else.
const anatomyRoleRenderState = { neutral: "neutral", supporting: "supporting", primary: "primary" } as const;

const labels: Record<string, string> = {
  // Rows render `muscleLabels[key] || key`, so any catalog key missing here
  // leaks into the UI as a raw identifier.
  upperBack: "Upper back", shoulders: "Shoulders", feet: "Feet",
  chest: "Pectoralis major", frontDelts: "Anterior deltoid", sideDelts: "Lateral deltoid",
  rearDelts: "Posterior deltoid", biceps: "Biceps brachii", brachialis: "Brachialis",
  brachioradialis: "Brachioradialis", triceps: "Triceps brachii", forearms: "Forearm compartments",
  abs: "Rectus abdominis", obliques: "External oblique", serratusAnterior: "Serratus anterior",
  hipFlexors: "Hip flexor complex", tfl: "Tensor fasciae latae", quads: "Quadriceps femoris",
  adductors: "Hip adductors", abductors: "Hip abductors", glutes: "Gluteal complex",
  hamstrings: "Hamstrings", calves: "Gastrocnemius", soleus: "Soleus",
  tibialis: "Tibialis anterior", peroneals: "Peroneus longus/brevis", lats: "Latissimus dorsi",
  traps: "Trapezius", rhomboids: "Rhomboids", lowerBack: "Spinal erectors",
  rotatorCuff: "Rotator cuff muscles"
};

const viewLabel = (view: "front" | "back") => (view === "front" ? "anterior" : "posterior");

export function AnatomyMap({ primary, secondary, onSelect, muscleScores, roleDetails, roleMethodology, showInspector = true }: AnatomyMapProps) {
  const [selectedKey, setSelectedKey] = useState("");
  /**
   * The exact drawn region under the finger. The figure draws the pectoralis in
   * two heads and the quadriceps in three; collapsing straight to the parent key
   * made every one of them read identically, so the subdivision the artwork is
   * drawing carried no meaning once selected.
   */
  const [selectedId, setSelectedId] = useState("");
  const [hoveredName, setHoveredName] = useState("");
  const [query, setQuery] = useState("");
  const [showAllRanked, setShowAllRanked] = useState(false);

  /* Which regions are involved, and in what categorical role. */
  const roles = useMemo<Record<string, AnatomyRole>>(() => roleMapForLists(primary, secondary), [primary, secondary]);

  /**
   * A region's role record, found under the region's own key or under whichever
   * incoming value resolved onto it. Movement records file the interscapular
   * region under `rhomboids` and the catalog files it under `upperBack`; the
   * athlete tapped one region either way.
   */
  const detailFor = useCallback((key: string): BodyLabRoleDetail | undefined => {
    if (roleDetails?.[key]) return roleDetails[key];
    const sources = sourceValuesForRegion(key, [...primary, ...secondary]);
    const match = sources.find((value) => roleDetails?.[value]);
    return match ? roleDetails?.[match] : undefined;
  }, [roleDetails, primary, secondary]);

  /* Ranked muscles for the strip */
  const ranked = useMemo(() => {
    const entries: { key: string; label: string; role: Role; roles?: string[]; confidence?: string }[] = [];
    const displayRole = (key: string): Role => {
      if (roles[key] === "primary") return "Primary";
      const detailRoles = detailFor(key)?.roles || [];
      if (detailRoles.includes("Primary Mover")) return "Primary";
      if (detailRoles.includes("Stabilizer")) return "Stabilizer";
      return "Synergist";
    };
    Object.keys(roles).forEach(key => {
      const detail = detailFor(key);
      entries.push({ key, label: labels[key] || key, role: displayRole(key), roles: detail?.roles, confidence: detail?.confidence || "Movement model" });
    });
    const fallbackOrder: Record<Role, number> = { Primary: 0, Stabilizer: 1, Synergist: 2 };
    const orderFor = (entry: typeof entries[number]) => {
      const detail = detailFor(entry.key);
      const firstRole = detail?.roles[0];
      return firstRole ? (detail?.roleOrder.indexOf(firstRole) ?? fallbackOrder[entry.role]) : fallbackOrder[entry.role];
    };
    return entries.sort((a, b) => orderFor(a) - orderFor(b)).slice(0, 8);
  }, [roles, detailFor]);
  /**
   * Every region the figure draws, in words.
   *
   * The ranking list only ever held the muscles this action uses, so the rest of
   * the body was reachable by tapping its shape and nothing else. That was a
   * fair ask at the old size; with both bodies sharing the canvas the smallest
   * shapes are around 12px, so the written route has to cover everything the
   * figure does — including the muscles this action has no role for.
   */
  const uninvolved = useMemo(() => {
    const drawn = Array.from(new Set([...drawnMuscleKeys.front, ...drawnMuscleKeys.back]));
    return drawn
      .filter((key) => !roles[key])
      .map((key) => ({ key, label: labels[key] || key, role: "Synergist" as Role, roles: undefined, confidence: undefined }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [roles]);

  const matches = (label: string) => !query || label.toLowerCase().includes(query.toLowerCase());
  const filteredRanked = ranked.filter(region => matches(region.label));
  const filteredUninvolved = uninvolved.filter(region => matches(region.label));
  const visibleRanked = showAllRanked ? filteredRanked : filteredRanked.slice(0, 5);
  const hiddenRankedCount = Math.max(0, filteredRanked.length - visibleRanked.length) + (showAllRanked ? 0 : filteredUninvolved.length);
  const roleSections: { role: Role; label: string; items: typeof visibleRanked }[] = [
    { role: "Primary", label: "Primary movers", items: visibleRanked.filter((region) => region.role === "Primary") },
    { role: "Stabilizer", label: "Stabilizers", items: visibleRanked.filter((region) => region.role === "Stabilizer") },
    { role: "Synergist", label: "Supporting", items: visibleRanked.filter((region) => region.role === "Synergist") },
  ];
  const roleCounts = { primary: ranked.filter((region) => region.role === "Primary").length, stabilizer: ranked.filter((region) => region.role === "Stabilizer").length, supporting: ranked.filter((region) => region.role === "Synergist").length };

  const chooseRegion = useCallback((key: string, pathId?: string) => {
    setSelectedKey(key);
    setSelectedId(pathId ?? "");
    onSelect(key);
  }, [onSelect]);

  const reset = () => { setSelectedKey(""); setSelectedId(""); setQuery(""); };
  const selectedLabel = selectedKey ? (labels[selectedKey] || selectedKey) : "";
  const hasLinkedExerciseOrStackContext = selectedKey ? muscleScores?.[selectedKey] != null : false;
  /**
   * The role of the selection, or nothing.
   *
   * This used to be a two-way branch on the primary list: anything not primary
   * was labelled a synergist, including muscles the selected action does not use
   * at all. Tapping the biceps during a wrestling action reported "SYNERGIST"
   * for a muscle with no record behind it. A muscle with no role in this action
   * has no role to show.
   */
  const selectedRole: Role | null = selectedKey
    ? (roles[selectedKey] === "primary" ? "Primary" : roles[selectedKey] === "supporting" ? "Synergist" : null)
    : null;
  const selectedRoleDetail = selectedKey ? detailFor(selectedKey) : undefined;
  const selectedMechanics = selectedKey ? getAnatomyMechanicsEvidence(selectedKey) : null;
  /**
   * Which body the selection is drawn on. With both views on one canvas this is
   * a pointer — "look at the back one" — rather than the flip prompt it used to
   * be: there is no longer a view the selection can be hiding behind.
   */
  const selectedViews = selectedKey ? viewsForRegion(selectedKey) : [];

  return (
    <section className="anatomy-atlas-pro">
      <div className="atlas-pro-head">
        <div>
          <p className="metric-label">Body Lab / qualitative role map</p>
          <h2>Selected action <em>role map.</em></h2>
        </div>
        <p>Color shows qualitative action roles, not activation or strength. Select a muscle to inspect.</p>
      </div>

      <div className="atlas-pro-grid">
        <aside className="atlas-pro-controls">
          <label className="atlas-pro-search">
            <Search className="h-4 w-4" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search muscle" />
          </label>
          <LocalSearchScope scope="Searching muscle names on this map." query={query} />
          <button className="atlas-reset-pro" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset view</button>
        </aside>

        <div className="atlas-pro-canvas">
          {/* Both bodies at once. The flip control, the Anterior/Posterior pills
              and the "shown on the other view" note were three affordances for
              one problem — half the body being hidden — and the problem is the
              thing worth removing, not the affordances. */}
          <div className="atlas-body-chart-wrap">
            <div className="atlas-body-chart">
              <AnatomyFigure
                view="both"
                roles={roles}
                selectedKeys={selectedKey ? [selectedKey] : []}
                onSelect={chooseRegion}
                labelFor={(key) => labels[key] || key}
                onHover={(key) => setHoveredName(key ? (labels[key] || key) : "")}
              />
            </div>
            <p className="atlas-view-captions" aria-hidden="true"><span>Anterior</span><span>Posterior</span></p>
            {hoveredName && <div className="atlas-hover-label">{hoveredName}</div>}
          </div>

          {/* Scan layer for the selection. The full inspector sits further down
              the page, past the legend and the methodology disclosure — on a
              phone that is a long scroll from the muscle you just tapped. The
              "Body Lab anatomical interaction and mode contract" asks that
              "selecting a region immediately exposes its state and a compact
              local action layer", so the decision-relevant part travels with
              the body, and the inspector stays the Explain/Inspect depth. */}
          {showInspector && selectedKey && <div className="atlas-selected-strip">
            <div>
              <p className="metric-label">Selected muscle</p>
              <strong>{selectedLabel}</strong>
              {regionPartName(selectedId) && <em className="atlas-selected-part">{regionPartName(selectedId)}</em>}
            </div>
            <span className="atlas-selected-role">{selectedRoleDetail?.roles.join(" · ") || selectedRole || "No role in this action"}</span>
            {selectedRole && <span className="atlas-selected-confidence">{selectedRoleDetail?.confidence || "Movement model"}</span>}
            {selectedViews.length > 0 && <span className="atlas-selected-where">
              {selectedViews.length === 2 ? "On both views" : `On the ${viewLabel(selectedViews[0])} view`}
            </span>}
          </div>}

          {/* Qualitative role legend */}
          <div className="atlas-heat-legend-pro">
            {/* Swatches carry the figure's own fills, gradients included, so the
                legend cannot drift from what the body is actually painted. */}
            <><span>Neutral</span><i className="atlas-swatch" style={{ background: "#e8ecf4" }} /><span>Supporting role</span><i className="atlas-swatch" style={{ background: "linear-gradient(180deg,#e9be55,#c08f24)" }} /><span>Primary role</span><i className="atlas-swatch" style={{ background: "linear-gradient(180deg,#ec5f4a,#bb2114)" }} /></>
          </div>
          <details className="atlas-role-methodology">
            <summary>How muscle roles are classified <ChevronDown className="h-4 w-4" /></summary>
            <div>
              <p>{roleMethodology || "Roles combine the selected sporting action’s reported prime movers, assisting muscles, stabilizers, and movement demands. They describe relevant contribution to that action rather than activation magnitude or force."}</p>
              <p><strong>Confidence labels</strong> indicate whether the role comes from direct action-specific evidence, strong indirect evidence, biomechanics-informed context, or a low-confidence fallback. These labels do not diagnose individual technique or capacity.</p>
            </div>
          </details>

        </div>

        {/* Inspector */}
        {showInspector && <aside className={`atlas-pro-inspector ${selectedKey ? "is-open" : ""}`}>
          {selectedKey ? (
            <>
              <div className="atlas-inspector-title">
                <div><p className="metric-label">Selected muscle</p><h3>{selectedLabel}</h3></div>
                <button onClick={() => setSelectedKey("")} aria-label="Clear muscle selection">×</button>
              </div>
              <div className="atlas-inspector-badges">
                <span>{selectedRoleDetail?.roles.join(" · ") || selectedRole || "No role in this action"}</span>
                {selectedRole && <i>{selectedRoleDetail?.confidence || "Movement model"}</i>}
                <b>{hasLinkedExerciseOrStackContext ? "Exercise / stack context" : "Sporting-action role"}</b>
              </div>
              <div className="atlas-why-pro">
                <p className="metric-label">Role</p>
                <p>{selectedRoleDetail?.explanation || (selectedRole === "Primary" ? "This muscle is a primary mover in the selected sporting action." : selectedRole === "Synergist" ? "This muscle supports the selected sporting action as a synergist or stabilizer." : "The selected sporting action’s record does not list this muscle in any role. That is an absence of evidence here, not a finding that the muscle is uninvolved.")}</p>
                {hasLinkedExerciseOrStackContext ? <p className="mt-2 text-[11px] leading-4 text-[var(--sg-text-subtle-on-light)]">A selected exercise or active stack provides additional context. The role shown remains qualitative; it is not an activation, force, or individual capacity measurement.</p> : <p className="mt-2 text-[11px] leading-4 text-[var(--sg-text-subtle-on-light)]">No exercise or active stack is loaded here. Color reflects qualitative role context, not measured activation or force.</p>}
              </div>
              {selectedRoleDetail?.phaseContext && <div className="atlas-why-pro"><p className="metric-label">Action phase context</p><p>{selectedRoleDetail.phaseContext}</p><p className="mt-2 text-[11px] leading-4 text-[var(--sg-text-subtle-on-light)]">This is the movement record’s qualitative contraction-phase description, not a timing or force measurement.</p></div>}
              {selectedRoleDetail && <div className="atlas-why-pro"><p className="metric-label">Evidence context</p><p>{selectedRoleDetail.sourceScope} · {selectedRoleDetail.confidence}</p>{selectedRoleDetail.sources.length > 0 && <p className="mt-2 text-[11px] leading-4 text-[var(--sg-text-subtle-on-light)]"><strong>Sources:</strong> {selectedRoleDetail.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer" className="underline underline-offset-2">{index === 0 ? "Primary source" : "Supporting source"}{index < selectedRoleDetail.sources.length - 1 ? " · " : ""}</a>)}</p>}</div>}
              {selectedMechanics && <div className="atlas-why-pro">
                <p className="metric-label">Architecture + leverage context</p>
                <p>{selectedMechanics.scope}</p>
                <p className="mt-2 text-[11px] leading-4 text-[var(--sg-text-subtle-on-light)]"><strong>Sources:</strong> {selectedMechanics.sources.join(" · ")}</p>
                <p className="mt-2 text-[11px] leading-4 text-[var(--sg-text-subtle-on-light)]"><strong>Worth knowing:</strong> {selectedMechanics.boundary}</p>
              </div>}
              {roleMethodology && <details className="atlas-full-analysis"><summary>View methodology <ChevronDown className="h-4 w-4" /></summary><div><p>{roleMethodology}</p></div></details>}
            </>
          ) : (
            <div className="atlas-inspector-empty-pro">
              <Target className="h-5 w-5" />
              <strong>Explore through the body</strong>
              <p>Select a muscle on either body to inspect its qualitative role, or pick one from the list of muscle roles.</p>
            </div>
          )}
        </aside>}
        <section className="atlas-ranking" aria-label="Key muscle roles">
          <div className="atlas-ranking-head"><p className="metric-label">Key muscle roles</p><strong>{ranked.length} muscles involved</strong><span>{roleCounts.primary} primary · {roleCounts.stabilizer} stabilizer · {roleCounts.supporting} supporting</span></div>
          {roleSections.filter((section) => section.items.length > 0).map((section) => <div className="atlas-role-section" key={section.role}><p>{section.label} <b>{ranked.filter((region) => region.role === section.role).length}</b></p>{section.items.map((region) => <button key={region.key} onClick={() => { setSelectedKey(region.key); setSelectedId(""); onSelect(region.key); }} className={selectedKey === region.key ? "is-selected" : ""} aria-pressed={selectedKey === region.key}><i className="atlas-rank-dot" style={{ background: region.role === "Primary" ? "#e4512e" : region.role === "Stabilizer" ? "#d5ad43" : "#7791a8" }} /><span>{region.label}</span><em>{region.roles?.[0] || `${region.role} role`}</em><ChevronRight className="h-4 w-4" /></button>)}</div>)}
          {/* The rest of the body, named rather than only drawn. These carry no
              role in this action, which is a fact worth stating — not a reason
              to make them unreachable except by hitting a 12px shape. */}
          {showAllRanked && filteredUninvolved.length > 0 && <div className="atlas-role-section atlas-role-section-inactive"><p>No role in this action <b>{filteredUninvolved.length}</b></p>{filteredUninvolved.map((region) => <button key={region.key} onClick={() => { setSelectedKey(region.key); setSelectedId(""); onSelect(region.key); }} className={selectedKey === region.key ? "is-selected" : ""} aria-pressed={selectedKey === region.key}><i className="atlas-rank-dot" style={{ background: "#c2ccd9" }} /><span>{region.label}</span><em>Not used here</em><ChevronRight className="h-4 w-4" /></button>)}</div>}
          {(showAllRanked || hiddenRankedCount > 0) && <button type="button" className="atlas-ranking-toggle" aria-expanded={showAllRanked} onClick={() => setShowAllRanked(value => !value)}>{showAllRanked ? "Show fewer" : `Show all ${filteredRanked.length + filteredUninvolved.length} muscles`}</button>}
        </section>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
