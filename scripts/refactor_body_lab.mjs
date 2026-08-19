import fs from "node:fs";

const file = "/home/ubuntu/gym-optimizer/client/src/pages/Home.tsx";
const source = fs.readFileSync(file, "utf8");
const start = source.indexOf('        {workspace === "body" && <section');
const end = source.indexOf('        {workspace === "movement"', start);
if (start < 0 || end < 0) throw new Error("Body Lab render boundaries not found");

const replacement = `        {workspace === "body" && <section className="body-lab-v2 space-y-5"><div className="view-header"><div><p className="metric-label">04 / interactive body laboratory</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">Body first.<br /><em className="text-[#e4512e]">Details on demand.</em></h1></div><div className="view-header-note"><Activity className="h-5 w-5 text-[#e4512e]" /><p>Use the heat map to inspect relevant tissue. Hover for a quick read; select for biomechanics and planning detail.</p></div></div><AnatomyMap primary={movementMuscles} secondary={movementSignals.includes("rotation") ? ["abs", "obliques", "glutes"] : ["abs", "glutes"]} onSelect={setActiveMuscle} /><div className="body-lab-quick-actions"><div><p className="metric-label">Current sporting action</p><strong>{selectedMovement.label}</strong><span>{selectedMovement.family}</span></div><div><p className="metric-label">Primary support</p><strong>{muscleLabels[activeMuscle] || activeMuscle}</strong><span>Selected from the atlas</span></div><button onClick={() => setWorkspace("recommended")}>Open matched exercises <ArrowUpRight className="h-4 w-4" /></button></div></section>}

`;

fs.writeFileSync(file, source.slice(0, start) + replacement + source.slice(end));
