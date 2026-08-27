import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { BodyChart, ViewSide, FRONT_MUSCLES, BACK_MUSCLES, MUSCLE_MAP } from "body-muscles";
import { ChevronDown, Focus, RotateCcw, RotateCw, Search, SlidersHorizontal, Target } from "lucide-react";
import { getAnatomyMechanicsEvidence } from "@/lib/anatomyMechanicsEvidence";
import type { BodyLabRoleDetail } from "@/lib/bodyLabRoleContext";
import "../anatomy-clean.css";

type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void; muscleScores?: Record<string, number>; roleDetails?: Record<string, BodyLabRoleDetail>; roleMethodology?: string; showInspector?: boolean };
type Role = "Primary" | "Synergist" | "Stabilizer";

/* Map our exercise catalog muscle keys to body-muscles library IDs */
const keyToIds: Record<string, string[]> = {
  chest: ["chest-upper-left", "chest-upper-right", "chest-lower-left", "chest-lower-right"],
  frontDelts: ["shoulder-front-left", "shoulder-front-right"],
  sideDelts: ["shoulder-side-left", "shoulder-side-right"],
  rearDelts: ["deltoid-rear-left", "deltoid-rear-right"],
  shoulders: ["shoulder-front-left", "shoulder-front-right", "shoulder-side-left", "shoulder-side-right", "deltoid-rear-left", "deltoid-rear-right"],
  biceps: ["biceps-left", "biceps-right"],
  brachialis: ["biceps-left", "biceps-right"],
  brachioradialis: ["forearm-left", "forearm-right"],
  triceps: ["triceps-long-left", "triceps-lateral-left", "triceps-long-right", "triceps-lateral-right"],
  forearms: ["forearm-left", "forearm-right", "forearm-flexors-left", "forearm-flexors-right", "forearm-extensors-left", "forearm-extensors-right"],
  abs: ["abs-upper-left", "abs-upper-right", "abs-lower-left", "abs-lower-right"],
  obliques: ["obliques-left", "obliques-right"],
  serratusAnterior: ["serratus-anterior-left", "serratus-anterior-right"],
  hipFlexors: ["hip-flexor-left", "hip-flexor-right"],
  tfl: ["hip-flexor-left", "hip-flexor-right"],
  quads: ["quads-left", "quads-right"],
  adductors: ["adductors-left", "adductors-right"],
  abductors: ["gluteus-medius-left", "gluteus-medius-right"],
  glutes: ["gluteus-maximus-left", "gluteus-maximus-right"],
  hamstrings: ["hamstrings-medial-left", "hamstrings-lateral-left", "hamstrings-medial-right", "hamstrings-lateral-right"],
  calves: ["calves-gastroc-medial-left", "calves-gastroc-lateral-left", "calves-gastroc-medial-right", "calves-gastroc-lateral-right"],
  soleus: ["calves-soleus-left", "calves-soleus-right"],
  tibialis: ["tibialis-anterior-left", "tibialis-anterior-right"],
  peroneals: ["calves-gastroc-lateral-left", "calves-gastroc-lateral-right"],
  lats: ["lats-upper-left", "lats-mid-left", "lats-lower-left", "lats-upper-right", "lats-mid-right", "lats-lower-right"],
  traps: ["traps-upper-left", "traps-mid-left", "traps-lower-left", "traps-upper-right", "traps-mid-right", "traps-lower-right"],
  rhomboids: ["traps-mid-left", "traps-mid-right"],
  lowerBack: ["lower-back-erectors-left", "lower-back-erectors-right", "lower-back-ql-left", "lower-back-ql-right"],
  rotatorCuff: ["deltoid-rear-left", "deltoid-rear-right"],
};

const labels: Record<string, string> = {
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

const aliases: Record<string, string[]> = {
  chest: ["chest", "pectoral", "pectoralis", "pec"],
  frontDelts: ["frontdelts", "anteriordelt", "shoulders"],
  sideDelts: ["sidedelts", "lateraldelt", "shoulders"],
  rearDelts: ["reardelts", "posteriordelt", "shoulders"],
  biceps: ["biceps"], brachialis: ["brachialis"], brachioradialis: ["brachioradialis"],
  triceps: ["triceps"], forearms: ["forearms", "grip", "wristflexors", "wristextensors"],
  abs: ["abs", "rectusabdominis"], obliques: ["obliques", "core", "externaloblique"],
  serratusAnterior: ["serratus", "serratusanterior"],
  hipFlexors: ["hipflexors", "iliopsoas"], tfl: ["tfl", "tensorfasciaelatae"],
  quads: ["quads", "quadriceps"], adductors: ["adductors"],
  abductors: ["abductors", "glutemedius"], glutes: ["glutes", "gluteusmaximus"],
  hamstrings: ["hamstrings"], calves: ["calves", "gastrocnemius"], soleus: ["soleus"],
  tibialis: ["tibialis"], peroneals: ["peroneals", "peroneus", "fibularis"],
  lats: ["lats", "latissimus"], traps: ["traps", "trapezius"], rhomboids: ["rhomboids"],
  lowerBack: ["lowerback", "erectors", "erectorspinae"],
  rotatorCuff: ["rotatorcuff", "infraspinatus"]
};

const clean = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
const matches = (key: string, values: string[]) => values.some(v => (aliases[key] || [key]).some(a => clean(v).includes(a)));
const tier = (s: number) => s >= 90 ? "S" : s >= 80 ? "A" : s >= 65 ? "B" : s >= 45 ? "C" : s >= 25 ? "D" : "F";
const heatSolid = (s: number) => s >= 90 ? "#db2f24" : s >= 75 ? "#f46933" : s >= 60 ? "#f5a13d" : s >= 40 ? "#d8c052" : s >= 20 ? "#73b8d9" : "#b0bfc8";

export function muscleScoreIntensity(score: number | undefined, fallback: number) {
  if (score == null) return fallback;
  if (score <= 0) return 0;
  return Math.max(2, Math.min(10, Math.round(score / 10)));
}

export function VectorAnatomyFallback({ view, ranked, onSelect, onRetry }: { view: "FRONT" | "BACK"; ranked: { key: string; label: string; role: Role; roles?: string[]; confidence?: string }[]; onSelect: (key: string) => void; onRetry: () => void }) {
  return <div className="grid min-h-[380px] place-items-center gap-4 border border-dashed border-[#9fb5c8] bg-[#f6fafc] px-4 py-6 text-center"><svg viewBox="0 0 180 300" role="img" aria-label={`Simplified ${view.toLowerCase()} anatomy fallback`} className="h-[270px] w-auto max-w-full"><circle cx="90" cy="28" r="19" fill="#d9e4eb" stroke="#8aa4b7" strokeWidth="2" /><path d="M61 56 Q90 45 119 56 L130 143 Q119 167 110 207 L104 276 L91 276 L90 212 L89 276 L76 276 L70 207 Q61 167 50 143 Z" fill="#e4edf2" stroke="#8aa4b7" strokeWidth="2" /><path d="M62 62 L35 119 L42 126 L70 88" fill="#e4edf2" stroke="#8aa4b7" strokeWidth="2" /><path d="M118 62 L145 119 L138 126 L110 88" fill="#e4edf2" stroke="#8aa4b7" strokeWidth="2" /><path d="M70 62 Q90 52 110 62 L114 119 Q90 130 66 119 Z" fill="#d9e4eb" opacity=".8" /><path d="M75 127 Q90 139 105 127 L108 183 Q90 193 72 183 Z" fill="#d9e4eb" opacity=".8" /><line x1="90" y1="58" x2="90" y2="185" stroke="#93aabd" strokeWidth="1" strokeDasharray="3 3" /></svg><div><p className="metric-label">Vector anatomy fallback</p><p className="mx-auto mt-1 max-w-[25rem] text-xs leading-5 text-[#49667f]">The detailed anatomy chart was unavailable. This simplified in-app reference keeps your relevant-muscle roles and selection controls available.</p><div className="mt-3 flex flex-wrap justify-center gap-2">{ranked.slice(0, 5).map((region) => <button key={region.key} onClick={() => onSelect(region.key)} className="border border-[#b8cad8] bg-white px-2 py-1 text-[10px] font-bold text-[#173d69] transition-colors hover:border-[#2d6cdf] hover:text-[#2d6cdf]">{region.label} · {region.roles?.join(" / ") || `${region.role || "Relevant"} role`}</button>)}</div><button onClick={onRetry} className="mt-4 text-[10px] font-bold uppercase tracking-[.08em] text-[#2d6cdf] underline underline-offset-4">Retry detailed anatomy chart</button></div></div>;
}

export function AnatomyMap({ primary, secondary, onSelect, muscleScores, roleDetails, roleMethodology, showInspector = true }: AnatomyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const [view, setView] = useState<"FRONT" | "BACK">("FRONT");
  const [selectedKey, setSelectedKey] = useState("");
  const [hoveredName, setHoveredName] = useState("");
  const [query, setQuery] = useState("");
  const [showAllRanked, setShowAllRanked] = useState(false);
  const [chartFailed, setChartFailed] = useState(false);

  /* Compute which muscles are involved and their intensity */
  const bodyState = useMemo(() => {
    const state: Record<string, { intensity: number; selected: boolean }> = {};

    const applyKey = (key: string, intensity: number) => {
      const ids = keyToIds[key];
      if (!ids) return;
      ids.forEach(id => {
        const existing = state[id];
        if (!existing || existing.intensity < intensity) {
          state[id] = { intensity, selected: selectedKey === key };
        }
      });
    };

    // Categorical role color is intentionally separate from any relative exercise/stack index.
    Object.keys(keyToIds).forEach(key => {
      if (matches(key, primary)) {
        applyKey(key, 9);
      }
    });
    Object.keys(keyToIds).forEach(key => {
      if (!matches(key, primary) && matches(key, secondary)) {
        applyKey(key, 6);
      }
    });

    return state;
  }, [primary, secondary, selectedKey]);

  /* Ranked muscles for the strip */
  const ranked = useMemo(() => {
    const entries: { key: string; label: string; role: Role; roles?: string[]; confidence?: string }[] = [];
    Object.keys(keyToIds).forEach(key => {
      if (matches(key, primary)) {
        entries.push({ key, label: labels[key] || key, role: "Primary", roles: roleDetails?.[key]?.roles, confidence: roleDetails?.[key]?.confidence || "Low-confidence inference" });
      } else if (matches(key, secondary)) {
        entries.push({ key, label: labels[key] || key, role: "Synergist", roles: roleDetails?.[key]?.roles, confidence: roleDetails?.[key]?.confidence || "Low-confidence inference" });
      }
    });
    return entries.sort((a, b) => (b.role === "Primary" ? 2 : 1) - (a.role === "Primary" ? 2 : 1)).slice(0, 8);
  }, [primary, secondary, roleDetails]);
  const filteredRanked = ranked.filter(region => !query || region.label.toLowerCase().includes(query.toLowerCase()));
  const visibleRanked = showAllRanked ? filteredRanked : filteredRanked.slice(0, 5);
  const hiddenRankedCount = Math.max(0, filteredRanked.length - visibleRanked.length);

  /* Initialize and update the body-muscles chart */
  useEffect(() => {
    if (chartFailed) return;
    if (!containerRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    try {
      chartRef.current = new BodyChart(containerRef.current, {
        view: view === "FRONT" ? ViewSide.FRONT : ViewSide.BACK,
        bodyState,
        onMuscleClick: (id: string, name: string) => {
          const matchedKey = Object.entries(keyToIds).find(([, ids]) => ids.includes(id))?.[0];
          if (matchedKey) {
            setSelectedKey(matchedKey);
            onSelect(matchedKey);
          }
        },
        onMuscleHover: (id: string | null) => {
          if (id) {
            const muscle = MUSCLE_MAP.find((m: any) => m.id === id);
            setHoveredName(muscle?.name || id);
          } else {
            setHoveredName("");
          }
        },
        enableTransitions: true,
      });
    } catch {
      chartRef.current?.destroy();
      chartRef.current = null;
      setChartFailed(true);
    }
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [view, chartFailed]);

  /* Update body state when muscles change */
  useEffect(() => {
    chartRef.current?.update({ bodyState });
  }, [bodyState]);

  const flipView = useCallback(() => {
    setView(v => v === "FRONT" ? "BACK" : "FRONT");
  }, []);

  const reset = () => { setView("FRONT"); setSelectedKey(""); setQuery(""); };
  const selectedLabel = selectedKey ? (labels[selectedKey] || selectedKey) : "";
  const selectedScore = selectedKey ? muscleScores?.[selectedKey] : undefined;
  const selectedRole: Role | null = selectedKey ? (matches(selectedKey, primary) ? "Primary" : "Synergist") : null;
  const selectedRoleDetail = selectedKey ? roleDetails?.[selectedKey] : undefined;
  const selectedMechanics = selectedKey ? getAnatomyMechanicsEvidence(selectedKey) : null;

  return (
    <section className="anatomy-atlas-pro">
      <div className="atlas-pro-head">
        <div>
          <p className="metric-label">Body Lab / involvement heat map</p>
          <h2>See the work. <em>Then inspect the why.</em></h2>
        </div>
        <p>Precise anatomical SVG with 70+ muscle regions. Only worked muscles show color. Click any muscle to inspect.</p>
      </div>

      <div className="atlas-pro-grid">
        <aside className="atlas-pro-controls">
          <div className="atlas-control-group">
            <span>View</span>
            <div className="atlas-pill-row">
              <button className={view === "FRONT" ? "is-active" : ""} onClick={() => setView("FRONT")}>Anterior</button>
              <button className={view === "BACK" ? "is-active" : ""} onClick={() => setView("BACK")}>Posterior</button>
            </div>
          </div>
          <label className="atlas-pro-search">
            <Search className="h-4 w-4" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search muscle" />
          </label>
          <button className="atlas-reset-pro" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset view</button>
        </aside>

        <div className="atlas-pro-canvas">
          <div className="atlas-canvas-header">
            <span className="atlas-view-label">{view === "FRONT" ? "Anterior view" : "Posterior view"}</span>
            <button className="atlas-flip-btn" onClick={flipView} aria-label="Switch between front and back view">
              <RotateCw className="h-4 w-4" />
              <span>{view === "FRONT" ? "Flip to Back" : "Flip to Front"}</span>
            </button>
          </div>

          {/* body-muscles chart container */}
          <div className="atlas-body-chart-wrap">
            {chartFailed ? <VectorAnatomyFallback view={view} ranked={ranked} onSelect={(key) => { setSelectedKey(key); onSelect(key); }} onRetry={() => setChartFailed(false)} /> : <><div ref={containerRef} className="atlas-body-chart" />{hoveredName && <div className="atlas-hover-label">{hoveredName}</div>}</>}
          </div>

          {/* Heat legend */}
          <div className="atlas-heat-legend-pro">
            <><span>Neutral</span><i className="atlas-swatch" style={{ background: "#c0cdd6" }} /><span>Supporting role</span><i className="atlas-swatch" style={{ background: "#d5ad43" }} /><span>Primary role</span><i className="atlas-swatch" style={{ background: "#db2f24" }} /></>
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
                <span>{selectedRoleDetail?.roles.join(" · ") || selectedRole}</span>
                {selectedRoleDetail && <i>{selectedRoleDetail.confidence}</i>}
                {selectedScore == null ? <b>Role context</b> : <><b>Relative model index {selectedScore}/100</b><i>{tier(selectedScore)} Tier</i></>}
              </div>
              <div className="atlas-why-pro">
                <p className="metric-label">Role</p>
                <p>{selectedRoleDetail?.explanation || (selectedRole === "Primary" ? "This muscle is a primary mover in the selected sporting action." : "This muscle supports the selected sporting action as a synergist or stabilizer.")}</p>
                {selectedScore == null ? <p className="mt-2 text-[10px] leading-4 text-[#657b92]">No exercise or active-stack score is loaded here. Color reflects qualitative role context, not measured activation or force.</p> : <p className="mt-2 text-[10px] leading-4 text-[#657b92]">This relative model index is derived from the active exercise or stack context. It is not a measured activation, force, or individual capacity score.</p>}
              </div>
              {selectedRoleDetail && <div className="atlas-why-pro"><p className="metric-label">Evidence context</p><p>{selectedRoleDetail.sourceScope} · {selectedRoleDetail.confidence}</p>{selectedRoleDetail.sources.length > 0 && <p className="mt-2 text-[10px] leading-4 text-[#657b92]"><strong>Sources:</strong> {selectedRoleDetail.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer" className="underline underline-offset-2">{index === 0 ? "Primary source" : "Supporting source"}{index < selectedRoleDetail.sources.length - 1 ? " · " : ""}</a>)}</p>}</div>}
              {selectedMechanics && <div className="atlas-why-pro">
                <p className="metric-label">Architecture + leverage context</p>
                <p>{selectedMechanics.scope}</p>
                <p className="mt-2 text-[10px] leading-4 text-[#657b92]"><strong>Sources:</strong> {selectedMechanics.sources.join(" · ")}</p>
                <p className="mt-2 text-[10px] leading-4 text-[#657b92]"><strong>Boundary:</strong> {selectedMechanics.boundary}</p>
              </div>}
              {(selectedScore != null || roleMethodology) && <details className="atlas-full-analysis"><summary>View methodology <ChevronDown className="h-4 w-4" /></summary><div><p>{roleMethodology || "The displayed context is a structured relative estimate based on the active exercise or stack, stated muscle role, and available mechanics evidence. It is not a direct laboratory measurement."}</p></div></details>}
            </>
          ) : (
            <div className="atlas-inspector-empty-pro">
              <Target className="h-5 w-5" />
              <strong>Explore through the body</strong>
              <p>Only worked muscles show color. Click any highlighted muscle to inspect its role and detailed analysis. Use the flip button to switch views.</p>
            </div>
          )}
        </aside>}
        <div className="atlas-ranking">
          <div><p className="metric-label">Key muscle roles</p><span>Click a row to focus it on the model. Expand only when you need the lower-ranked relevant muscles.</span></div>
          {visibleRanked.map(region => (
            <button key={region.key} onClick={() => { setSelectedKey(region.key); onSelect(region.key); }} className={selectedKey === region.key ? "is-selected" : ""}>
              <i className="atlas-rank-dot" style={{ background: region.role === "Primary" ? "#e4512e" : "#d5ad43" }} />
              <span>{region.label}</span>
              <em>{region.roles?.join(" · ") || `${region.role} role`} · {region.confidence}</em>
            </button>
          ))}
          {filteredRanked.length > 5 && <button type="button" className="atlas-ranking-toggle" aria-expanded={showAllRanked} onClick={() => setShowAllRanked(value => !value)}>{showAllRanked ? "Show fewer muscle roles" : `Show ${hiddenRankedCount} more muscle role${hiddenRankedCount === 1 ? "" : "s"}`}</button>}
        </div>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
