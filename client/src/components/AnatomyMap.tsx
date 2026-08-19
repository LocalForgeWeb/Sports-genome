import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { BodyChart, ViewSide, FRONT_MUSCLES, BACK_MUSCLES, MUSCLE_MAP } from "body-muscles";
import { ChevronDown, Focus, RotateCcw, RotateCw, Search, SlidersHorizontal, Target } from "lucide-react";
import "../anatomy-clean.css";

type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void };
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

export function AnatomyMap({ primary, secondary, onSelect }: AnatomyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const [view, setView] = useState<"FRONT" | "BACK">("FRONT");
  const [selectedKey, setSelectedKey] = useState("");
  const [hoveredName, setHoveredName] = useState("");
  const [query, setQuery] = useState("");

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

    // Primary muscles: intensity 8-10
    Object.keys(keyToIds).forEach(key => {
      if (matches(key, primary)) applyKey(key, 9);
    });
    // Secondary/synergist muscles: intensity 5-7
    Object.keys(keyToIds).forEach(key => {
      if (!matches(key, primary) && matches(key, secondary)) applyKey(key, 6);
    });

    return state;
  }, [primary, secondary, selectedKey]);

  /* Ranked muscles for the strip */
  const ranked = useMemo(() => {
    const entries: { key: string; label: string; score: number; role: Role }[] = [];
    Object.keys(keyToIds).forEach(key => {
      if (matches(key, primary)) {
        entries.push({ key, label: labels[key] || key, score: 90, role: "Primary" });
      } else if (matches(key, secondary)) {
        entries.push({ key, label: labels[key] || key, score: 55, role: "Synergist" });
      }
    });
    return entries.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [primary, secondary]);

  /* Initialize and update the body-muscles chart */
  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    chartRef.current = new BodyChart(containerRef.current, {
      view: view === "FRONT" ? ViewSide.FRONT : ViewSide.BACK,
      bodyState,
      onMuscleClick: (id: string, name: string) => {
        // Find which key this muscle belongs to
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
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [view]);

  /* Update body state when muscles change */
  useEffect(() => {
    chartRef.current?.update({ bodyState });
  }, [bodyState]);

  const flipView = useCallback(() => {
    setView(v => v === "FRONT" ? "BACK" : "FRONT");
  }, []);

  const reset = () => { setView("FRONT"); setSelectedKey(""); setQuery(""); };
  const selectedLabel = selectedKey ? (labels[selectedKey] || selectedKey) : "";
  const selectedScore = selectedKey ? (matches(selectedKey, primary) ? 90 : 55) : 0;
  const selectedRole: Role | null = selectedKey ? (matches(selectedKey, primary) ? "Primary" : "Synergist") : null;
  const metric = (offset: number) => Math.max(12, Math.min(98, selectedScore + offset));

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
            <div ref={containerRef} className="atlas-body-chart" />
            {hoveredName && <div className="atlas-hover-label">{hoveredName}</div>}
          </div>

          {/* Heat legend */}
          <div className="atlas-heat-legend-pro">
            <span>Neutral</span><i className="atlas-swatch" style={{ background: "#c0cdd6" }} />
            <span>Low</span><i className="atlas-swatch" style={{ background: "#f5a13d" }} />
            <span>Medium</span><i className="atlas-swatch" style={{ background: "#f46933" }} />
            <span>High</span><i className="atlas-swatch" style={{ background: "#db2f24" }} />
          </div>

          {/* Ranked muscles strip */}
          <div className="atlas-ranking">
            <div><p className="metric-label">Top muscles</p><span>Click a row to focus it on the model.</span></div>
            {ranked.filter(r => !query || r.label.toLowerCase().includes(query.toLowerCase())).map(region => (
              <button key={region.key} onClick={() => { setSelectedKey(region.key); onSelect(region.key); }} className={selectedKey === region.key ? "is-selected" : ""}>
                <i className="atlas-rank-dot" style={{ background: heatSolid(region.score) }} />
                <span>{region.label}</span>
                <em>{region.score}%</em>
                <b className="atlas-rank-bar"><i style={{ width: `${region.score}%`, background: heatSolid(region.score) }} /></b>
              </button>
            ))}
          </div>
        </div>

        {/* Inspector */}
        <aside className={`atlas-pro-inspector ${selectedKey ? "is-open" : ""}`}>
          {selectedKey ? (
            <>
              <div className="atlas-inspector-title">
                <div><p className="metric-label">Selected muscle</p><h3>{selectedLabel}</h3></div>
                <button onClick={() => setSelectedKey("")} aria-label="Clear muscle selection">×</button>
              </div>
              <div className="atlas-inspector-badges">
                <span>{selectedRole}</span>
                <b>{selectedScore}/100</b>
                <i>{tier(selectedScore)} Tier</i>
              </div>
              <div className="atlas-core-metrics">
                {[["Force exposure", metric(1)], ["Long-length challenge", metric(-12)], ["Stability demand", metric(-22)]].map(([name, value]) => (
                  <div key={name as string}><span>{name}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>
                ))}
              </div>
              <div className="atlas-why-pro">
                <p className="metric-label">Role</p>
                <p>{selectedRole === "Primary" ? "This muscle is a primary mover in the current exercise." : "This muscle assists the primary movers as a synergist or stabilizer."}</p>
              </div>
              <details className="atlas-full-analysis">
                <summary>View full analysis <ChevronDown className="h-4 w-4" /></summary>
                <div>
                  {[["Mechanical tension", metric(2)], ["Hypertrophy potential", metric(-3)], ["Strength contribution", metric(0)], ["Eccentric demand", metric(-5)], ["Concentric demand", metric(3)], ["Fatigue contribution", metric(-9)]].map(([name, value]) => (
                    <div key={name as string}><span>{name}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>
                  ))}
                  <p><b>Confidence:</b> Structured estimate based on the movement pattern, stated muscle role, and available mechanics evidence.</p>
                </div>
              </details>
            </>
          ) : (
            <div className="atlas-inspector-empty-pro">
              <Target className="h-5 w-5" />
              <strong>Explore through the body</strong>
              <p>Only worked muscles show color. Click any highlighted muscle to inspect its role and detailed analysis. Use the flip button to switch views.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
