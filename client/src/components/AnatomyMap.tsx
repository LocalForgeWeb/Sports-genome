import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
import { defaultAnatomySide, oppositeSide, sideForSelection, sideLabel, turnToSideLabel, type AnatomySide } from "@/lib/anatomySide";
import { roleMapForLists, sourceValuesForRegion, viewsForRegion, regionPartName, regionParts, partFromPathId, type AnatomyRole } from "@/lib/anatomyRegions";
import { drawnMuscleKeys } from "@/components/anatomy/figureGeometry";
import { ChevronDown, ChevronRight, RotateCw } from "lucide-react";
import { getAnatomyMechanicsEvidence } from "@/lib/anatomyMechanicsEvidence";
import type { BodyLabRoleDetail } from "@/lib/bodyLabRoleContext";
import "../anatomy-clean.css";

type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void; /** A selection made elsewhere in the app, which the figure should show. */ selectedKey?: string | null; muscleScores?: Record<string, number>; roleDetails?: Record<string, BodyLabRoleDetail>; roleMethodology?: string; showInspector?: boolean };
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

export function AnatomyMap({ primary, secondary, onSelect, selectedKey: externalKey, muscleScores, roleDetails, roleMethodology, showInspector = true }: AnatomyMapProps) {
  const [selectedKey, setSelectedKey] = useState(externalKey ?? "");
  /**
   * The exact drawn region under the finger. The figure draws the pectoralis in
   * two heads and the quadriceps in three; collapsing straight to the parent key
   * made every one of them read identically, so the subdivision the artwork is
   * drawing carried no meaning once selected.
   */
  const [selectedId, setSelectedId] = useState("");
  /** The named head of the selection, when the artwork draws the muscle in several. */
  const [selectedPart, setSelectedPart] = useState("");
  const [hoveredName, setHoveredName] = useState("");
  // One body at a time, front first. A selection can arrive from the ranked list
  // or from elsewhere in the app, so the figure turns to face whatever was
  // picked rather than leaving it on the side pointing away.
  const [side, setSide] = useState<AnatomySide>(defaultAnatomySide);
  const [showAllRanked, setShowAllRanked] = useState(false);

  // Follow the app's selection when it changes; a whole-muscle selection from
  // outside carries no head, so the ring covers the muscle. A tap on the figure
  // also reaches here — chooseRegion reports the key up, the app hands it back
  // — so a key that matches what is already selected is an echo, not a change,
  // and must not clear the head the athlete just pointed at.
  const selectedKeyRef = useRef(selectedKey);
  selectedKeyRef.current = selectedKey;
  useEffect(() => {
    if (externalKey === undefined) return;
    const next = externalKey ?? "";
    if (next === selectedKeyRef.current) return;
    setSelectedKey(next);
    setSelectedId("");
    setSelectedPart("");
  }, [externalKey]);

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

  const filteredRanked = ranked;
  const filteredUninvolved = uninvolved;
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
    setSelectedPart(partFromPathId(pathId) ?? "");
    onSelect(key);
  }, [onSelect]);

  /**
   * The heads this muscle is drawn in.
   *
   * A pointer can already single one out by landing on it, but that made the
   * subdivision a thing you could only discover by accident and never reach
   * from a keyboard. These name them, so picking the vastus medialis is an
   * explicit choice rather than a precise tap.
   */
  const selectedParts = useMemo(() => (selectedKey ? regionParts(selectedKey) : []), [selectedKey]);
  useEffect(() => { setSide((current) => sideForSelection(current, selectedKey ? [selectedKey] : [])); }, [selectedKey]);
  const selectedPartName = selectedParts.find((entry) => entry.part === selectedPart)?.label
    ?? regionPartName(selectedId);

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
      {/* No heading above the body. There were two — "Body Lab / qualitative
          role map" and "Selected action role map." — plus a search over eight
          muscle names and a Reset for a view that no longer flips. Measured on
          a phone they put the first pixel of body at 968px. The navigator
          already names the action; the legend already says what colour means. */}
      <div className="atlas-pro-grid">
        <div className="atlas-pro-canvas">
          <div className="atlas-body-chart-wrap">
            <div className="atlas-body-chart">
              <AnatomyFigure
                view={side}
                roles={roles}
                selectedKeys={selectedKey ? [selectedKey] : []}
                selectedPart={selectedPart || null}
                onSelect={chooseRegion}
                labelFor={(key) => labels[key] || key}
                onHover={(key) => setHoveredName(key ? (labels[key] || key) : "")}
              />
            </div>
            <div className="atlas-view-captions"><span aria-hidden="true">{side === "front" ? "Anterior" : "Posterior"}</span><button type="button" className="atlas-side-toggle" aria-label={`${turnToSideLabel(side)} of the body`} onClick={() => setSide(oppositeSide(side))}><RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> {turnToSideLabel(side)}</button></div>
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
              {selectedPartName && <em className="atlas-selected-part">{selectedPartName}</em>}
            </div>
            <span className="atlas-selected-role">{selectedRoleDetail?.roles.join(" · ") || selectedRole || "No role in this action"}</span>
            {selectedRole && <span className="atlas-selected-confidence">{selectedRoleDetail?.confidence || "Movement model"}</span>}
            {selectedViews.length > 0 && <span className="atlas-selected-where">
              {selectedViews.length === 2 ? "On both views" : `On the ${viewLabel(selectedViews[0])} view`}
            </span>}
            {/* The strip is the whole inspector on a phone — the panel beside
                the body is hidden under 901px — so the heads have to be here
                too or they are pointer-only on the device that has no pointer. */}
            {selectedParts.length > 1 && <div className="atlas-part-picker" role="group" aria-label={`${selectedLabel} heads`}>
              <button type="button" aria-pressed={!selectedPart} onClick={() => { setSelectedPart(""); setSelectedId(""); }}>Whole muscle</button>
              {selectedParts.map((entry) => <button key={entry.part} type="button" aria-pressed={selectedPart === entry.part} onClick={() => setSelectedPart(entry.part)}>{entry.label}</button>)}
            </div>}
          </div>}

          {/* Qualitative role legend */}
          <div className="atlas-heat-legend-pro">
            {/* Swatches carry the figure's own fills, gradients included, so the
                legend cannot drift from what the body is actually painted. */}
            <><i className="atlas-swatch" style={{ background: "#e8ecf4" }} /><span>Neutral</span><i className="atlas-swatch" style={{ background: "linear-gradient(180deg,#e9be55,#c08f24)" }} /><span>Supporting role</span><i className="atlas-swatch" style={{ background: "linear-gradient(180deg,#ec5f4a,#bb2114)" }} /><span>Primary role</span></>
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
              {/**
                * Four stacked blocks, each a heading over a paragraph over a
                * caveat, and the caveats said the same thing three times over:
                * "not measured activation or force", "not a timing or force
                * measurement", "not a personal force estimate". Two of the four
                * headings were the word "context". What actually differs between
                * one muscle and the next — its role, the phase it works in, how
                * well evidenced that is — was the smallest part of the panel.
                *
                * So: the differing facts first and scannable, prose only where
                * prose is the content, and the boundary stated once at the end.
                */}
              <div className="atlas-inspector-title atlas-desktop-only">
                <div>
                  <p className="metric-label">Selected muscle</p>
                  <h3>{selectedLabel}</h3>
                  {selectedPartName && <p className="atlas-inspector-part">{selectedPartName}</p>}
                </div>
                <button onClick={() => { setSelectedKey(""); setSelectedId(""); setSelectedPart(""); }} aria-label="Clear muscle selection">×</button>
              </div>

              {selectedParts.length > 1 && <div className="atlas-part-picker atlas-desktop-only" role="group" aria-label={`${selectedLabel} heads`}>
                <button type="button" aria-pressed={!selectedPart} onClick={() => { setSelectedPart(""); setSelectedId(""); }}>Whole muscle</button>
                {selectedParts.map((entry) => <button key={entry.part} type="button" aria-pressed={selectedPart === entry.part} onClick={() => setSelectedPart(entry.part)}>{entry.label}</button>)}
              </div>}

              <dl className="atlas-inspector-facts">
                <div><dt>Role</dt><dd>{selectedRoleDetail?.roles.join(" · ") || selectedRole || "None in this action"}</dd></div>
                {selectedRoleDetail?.phaseContext && <div><dt>Works through</dt><dd>{selectedRoleDetail.phaseContext}</dd></div>}
                <div><dt>Evidence</dt><dd>{selectedRoleDetail ? `${selectedRoleDetail.sourceScope} · ${selectedRoleDetail.confidence}` : hasLinkedExerciseOrStackContext ? "Exercise and stack context" : "Movement model"}</dd></div>
              </dl>

              <p className="atlas-inspector-why">{selectedRoleDetail?.explanation || (selectedRole === "Primary" ? "This muscle is a primary mover in the selected sporting action." : selectedRole === "Synergist" ? "This muscle supports the selected sporting action as a synergist or stabilizer." : "The selected sporting action’s record does not list this muscle in any role. That is an absence of evidence here, not a finding that the muscle is uninvolved.")}</p>

              {selectedMechanics && <div className="atlas-why-pro">
                <p className="metric-label">Architecture and leverage</p>
                <p>{selectedMechanics.scope}</p>
                <p className="atlas-inspector-boundary">{selectedMechanics.boundary}</p>
              </div>}

              {(selectedRoleDetail?.sources.length || selectedMechanics) && <p className="atlas-inspector-sources">
                <strong>Sources:</strong>{" "}
                {selectedRoleDetail?.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer">{index === 0 ? "Primary source" : "Supporting source"}{index < selectedRoleDetail.sources.length - 1 ? " · " : ""}</a>)}
                {selectedRoleDetail?.sources.length && selectedMechanics ? " · " : ""}
                {selectedMechanics?.sources.join(" · ")}
              </p>}

              {/* Said once, rather than after every block. */}
              <p className="atlas-inspector-boundary atlas-inspector-boundary-final">Colour shows a qualitative role in this action, not measured activation, force, or anything about your own capacity.</p>

              {roleMethodology && <details className="atlas-full-analysis"><summary>View methodology <ChevronDown className="h-4 w-4" /></summary><div><p>{roleMethodology}</p></div></details>}
            </>
          ) : (
            <p className="atlas-inspector-empty-pro">Tap a muscle to see its role here.</p>
          )}
        </aside>}
        <section className="atlas-ranking" aria-label="Key muscle roles">
          <div className="atlas-ranking-head"><p className="metric-label">Key muscle roles</p><strong>{ranked.length} muscles involved</strong><span>{([["primary", roleCounts.primary], ["stabilizer", roleCounts.stabilizer], ["supporting", roleCounts.supporting]] as const).filter(([, n]) => n > 0).map(([word, n]) => `${n} ${word}`).join(" · ")}</span></div>
          {roleSections.filter((section) => section.items.length > 0).map((section) => <div className="atlas-role-section" key={section.role}><p>{section.label} <b>{ranked.filter((region) => region.role === section.role).length}</b></p>{section.items.map((region) => <button key={region.key} onClick={() => { setSelectedKey(region.key); setSelectedId(""); setSelectedPart(""); onSelect(region.key); }} className={selectedKey === region.key ? "is-selected" : ""} aria-pressed={selectedKey === region.key}><i className="atlas-rank-dot" style={{ background: region.role === "Primary" ? "#e4512e" : region.role === "Stabilizer" ? "#d5ad43" : "#7791a8" }} /><span>{region.label}</span>{(() => { const detail = region.roles?.[0]; const sectionWord = section.label.replace(/s$/, "").toLowerCase(); const note = detail && !detail.toLowerCase().startsWith(sectionWord) ? detail : ""; return note ? <em>{note}</em> : <em aria-hidden="true" />; })()}<ChevronRight className="h-4 w-4" /></button>)}</div>)}
          {/* The rest of the body, named rather than only drawn. These carry no
              role in this action, which is a fact worth stating — not a reason
              to make them unreachable except by hitting a 12px shape. */}
          {showAllRanked && filteredUninvolved.length > 0 && <div className="atlas-role-section atlas-role-section-inactive"><p>No role in this action <b>{filteredUninvolved.length}</b></p>{filteredUninvolved.map((region) => <button key={region.key} onClick={() => { setSelectedKey(region.key); setSelectedId(""); setSelectedPart(""); onSelect(region.key); }} className={selectedKey === region.key ? "is-selected" : ""} aria-pressed={selectedKey === region.key}><i className="atlas-rank-dot" style={{ background: "#c2ccd9" }} /><span>{region.label}</span><em>Not used here</em><ChevronRight className="h-4 w-4" /></button>)}</div>}
          {(showAllRanked || hiddenRankedCount > 0) && <button type="button" className="atlas-ranking-toggle" aria-expanded={showAllRanked} onClick={() => setShowAllRanked(value => !value)}>{showAllRanked ? "Show fewer" : `Show all ${filteredRanked.length + filteredUninvolved.length} muscles`}</button>}
        </section>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
