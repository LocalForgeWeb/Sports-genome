/** Kinetic Field Manual: a clickable vector muscle map turns catalog metadata into visible training logic. */
import { useState } from "react";

type AnatomyMapProps = {
  primary: string[];
  secondary: string[];
  onSelect: (muscle: string) => void;
};

const labels: Record<string, string> = {
  chest: "Pectorals", frontDelts: "Front deltoids", sideDelts: "Side deltoids", rearDelts: "Rear deltoids",
  biceps: "Biceps", triceps: "Triceps", forearms: "Forearms & grip", abs: "Rectus abdominis", obliques: "Obliques",
  quads: "Quadriceps", adductors: "Adductors", abductors: "Hip abductors", glutes: "Gluteals", hamstrings: "Hamstrings",
  calves: "Calves", tibialis: "Tibialis anterior", lats: "Latissimus dorsi", upperBack: "Upper back", traps: "Trapezius",
  lowerBack: "Spinal erectors", rotatorCuff: "Rotator cuff", brachialis: "Brachialis", hipFlexors: "Hip flexors", feet: "Foot stabilizers", shoulders: "Deltoids",
};

const aliases: Record<string, string[]> = {
  shoulders: ["frontDelts", "sideDelts", "rearDelts"],
  frontDelts: ["shoulders"], sideDelts: ["shoulders"], rearDelts: ["shoulders"],
};

const frontParts = [
  ["frontDelts", "M72 92 C50 86 43 106 49 126 L76 130 L87 104 Z M188 92 C210 86 217 106 211 126 L184 130 L173 104 Z"],
  ["chest", "M84 111 C102 99 119 106 128 122 C137 106 154 99 172 111 L170 151 C153 154 142 149 128 141 C114 149 103 154 86 151 Z"],
  ["biceps", "M52 132 L79 132 L80 192 C70 204 57 196 54 181 Z M176 132 L204 132 L202 181 C199 196 186 204 176 192 Z"],
  ["forearms", "M54 184 C62 194 71 199 79 192 L78 246 C66 259 53 250 51 232 Z M176 192 C184 199 194 194 202 184 L205 232 C203 250 190 259 178 246 Z"],
  ["abs", "M107 153 L149 153 L154 246 L102 246 Z"],
  ["obliques", "M87 157 L105 153 L101 245 L79 219 Z M151 153 L169 157 L177 219 L155 245 Z"],
  ["hipFlexors", "M93 246 L126 245 L115 283 L84 283 Z M134 245 L167 246 L176 283 L145 283 Z"],
  ["quads", "M83 281 L119 281 L118 376 L78 376 Z M137 281 L173 281 L178 376 L138 376 Z"],
  ["adductors", "M111 282 L127 282 L126 375 L108 375 Z M129 282 L145 282 L148 375 L130 375 Z"],
  ["tibialis", "M79 376 L113 376 L111 446 L82 446 Z M143 376 L177 376 L174 446 L145 446 Z"],
  ["calves", "M84 401 L111 401 L110 450 L80 450 Z M145 401 L172 401 L176 450 L146 450 Z"],
];

const backParts = [
  ["rearDelts", "M72 92 C50 86 43 106 49 126 L76 130 L87 104 Z M188 92 C210 86 217 106 211 126 L184 130 L173 104 Z"],
  ["traps", "M91 104 L128 80 L165 104 L157 132 L99 132 Z"],
  ["upperBack", "M84 128 L172 128 L170 193 L86 193 Z"],
  ["lats", "M86 158 L112 153 L125 215 L91 235 Z M144 153 L170 158 L165 235 L131 215 Z"],
  ["triceps", "M52 132 L79 132 L80 196 C69 204 56 196 53 180 Z M176 132 L204 132 L203 180 C200 196 187 204 176 196 Z"],
  ["forearms", "M53 184 C61 194 71 200 79 194 L78 248 C66 259 53 249 51 232 Z M177 194 C185 200 195 194 203 184 L205 232 C203 249 190 259 178 248 Z"],
  ["lowerBack", "M104 201 L152 201 L161 271 L95 271 Z"],
  ["glutes", "M89 266 C105 249 121 255 128 274 C135 255 151 249 167 266 L171 303 L85 303 Z"],
  ["hamstrings", "M84 303 L120 303 L117 387 L78 387 Z M136 303 L172 303 L178 387 L139 387 Z"],
  ["calves", "M81 388 L114 388 L111 451 L80 451 Z M142 388 L175 388 L176 451 L145 451 Z"],
];

export function AnatomyMap({ primary, secondary, onSelect }: AnatomyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const parts = view === "front" ? frontParts : backParts;
  const active = (key: string, list: string[]) => list.includes(key) || (aliases[key] || []).some((alias) => list.includes(alias));

  return (
    <div className="anatomy-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="field-label">Activation map</p>
          <p className="mt-1 text-xs text-[#6f7774]">Select a highlighted region for its role.</p>
        </div>
        <div className="flex border border-[#d8d9d3] p-1 text-[10px] font-bold uppercase tracking-[0.14em]">
          <button onClick={() => setView("front")} className={`px-2.5 py-1 ${view === "front" ? "bg-[#1c2937] text-white" : "text-[#6f7774]"}`}>Front</button>
          <button onClick={() => setView("back")} className={`px-2.5 py-1 ${view === "back" ? "bg-[#1c2937] text-white" : "text-[#6f7774]"}`}>Back</button>
        </div>
      </div>
      <svg viewBox="0 0 260 480" className="mx-auto block h-[330px] max-w-full" aria-label={`${view} muscle activation map`}>
        <path d="M111 40 C99 48 99 73 111 83 L89 101 L76 141 L80 252 L71 282 L78 380 L77 454 L115 454 L127 307 L133 307 L145 454 L183 454 L182 380 L189 282 L180 252 L184 141 L171 101 L149 83 C161 73 161 48 149 40 C140 30 120 30 111 40 Z" fill="#eef0eb" stroke="#cfd4cc" strokeWidth="2" />
        {parts.map(([key, path]) => {
          const isPrimary = active(key, primary);
          const isSecondary = active(key, secondary);
          return <path key={key} d={path} onClick={() => onSelect(key)} className="cursor-pointer transition-all duration-200 hover:opacity-80" fill={isPrimary ? "#e4512e" : isSecondary ? "#f7cf6c" : "#dde3da"} stroke={isPrimary ? "#c63e1f" : "#c9d0c6"} strokeWidth="1.2"><title>{labels[key] || key}</title></path>;
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#69736d]">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 bg-[#e4512e]" />Primary</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 bg-[#f7cf6c]" />Secondary</span>
      </div>
    </div>
  );
}

export { labels as muscleLabels };
