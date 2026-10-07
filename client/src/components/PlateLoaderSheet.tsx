import { useMemo, useState, type ReactElement } from "react";
import { Check, Copy, Minus, Plus, Trash2 } from "lucide-react";
import { UtilitySheet } from "@/components/UtilitySheet";
import { useUtilityRecord } from "@/lib/utilityStore";
import { copyText } from "@/lib/workoutShare";
import { barPresets, calculatePlates, defaultPlateProfiles, eachSideText, formatAmount, loadingInstructions, pairsText, parseAmount, totalText, type PlateLoad, type PlateProfile, type PlateUnit } from "@/lib/plateLoading";

/**
 * Load the bar: a target total in, what to put on each side out.
 *
 * A calculator, not a record: nothing here logs a set, changes a prescription or starts a
 * timer. The inventory (bar, plates, collars) is kept per account on this device; the target
 * is a draft for this sheet only, kept per unit so 185 lb is never shown as 185 kg.
 */
type PlateStore = { version: 1; unit: PlateUnit; profiles: Record<PlateUnit, PlateProfile> };
const PLATE_STORE = "sg-plate-inventory-v1";
const fallbackStore: PlateStore = { version: 1, unit: "lb", profiles: { lb: defaultPlateProfiles.lb, kg: defaultPlateProfiles.kg } };
const isPlateStore = (value: unknown): value is PlateStore => {
  const store = value as PlateStore;
  return Boolean(store && store.version === 1 && (store.unit === "lb" || store.unit === "kg") && store.profiles?.lb && store.profiles?.kg && Array.isArray(store.profiles.lb.plates) && Array.isArray(store.profiles.kg.plates));
};

const unitNames: Record<PlateUnit, string> = { lb: "Pounds (lb)", kg: "Kilograms (kg)" };

export function PlateLoaderSheet({ onClose, exerciseName, initialTarget, initialUnit }: { onClose: () => void; exerciseName?: string; initialTarget?: string; initialUnit?: PlateUnit }) {
  const [store, writeStore] = useUtilityRecord<PlateStore>(PLATE_STORE, fallbackStore, isPlateStore);
  const [unit, setUnit] = useState<PlateUnit>(initialUnit ?? store.unit);
  const [targets, setTargets] = useState<Record<PlateUnit, string>>(() => ({ lb: "", kg: "", ...(initialTarget ? { [initialUnit ?? store.unit]: initialTarget } : {}) }));
  const [barText, setBarText] = useState<Record<PlateUnit, string>>(() => ({ lb: formatAmount(Math.round(store.profiles.lb.bar * 100)), kg: formatAmount(Math.round(store.profiles.kg.bar * 100)) }));
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [newPlate, setNewPlate] = useState("");

  const saved = store.profiles[unit];
  // A bar being typed is used as soon as it reads as a number; until then the result says why it can't load.
  const typedBar = parseAmount(barText[unit]);
  const profile: PlateProfile = { ...saved, bar: typedBar === null ? Number.NaN : typedBar / 100 };
  const result = useMemo(() => calculatePlates(targets[unit], profile, unit), [targets, unit, profile.bar, saved]);
  const largestPlate = Math.max(...saved.plates.map((plate) => plate.weight), 1);

  const persist = (nextProfile: PlateProfile, nextUnit = unit) => {
    const kept = writeStore({ version: 1, unit: nextUnit, profiles: { ...store.profiles, [unit]: nextProfile } });
    setSaveState(kept ? "saved" : "failed");
  };
  const chooseUnit = (next: PlateUnit) => {
    if (next === unit) return;
    setUnit(next);
    setCopied(false);
    setStatus("");
    writeStore({ ...store, unit: next });
  };
  const setBar = (text: string) => {
    setBarText((current) => ({ ...current, [unit]: text }));
    const value = parseAmount(text);
    if (value !== null && value > 0) persist({ ...saved, bar: value / 100 });
  };
  const setCount = (weight: number, count: number) => {
    const plates = saved.plates.map((plate) => (plate.weight === weight ? { ...plate, count: Math.max(0, Math.min(200, Math.round(count))) } : plate));
    persist({ ...saved, plates });
  };
  const removePlate = (weight: number) => persist({ ...saved, plates: saved.plates.filter((plate) => plate.weight !== weight) });
  const addPlate = () => {
    const value = parseAmount(newPlate);
    if (value === null || value <= 0) { setStatus("Enter a plate size as a positive number, like 1.25."); return; }
    const weight = value / 100;
    if (saved.plates.some((plate) => plate.weight === weight)) { setStatus(`${formatAmount(value)} ${unit} plates are already listed.`); return; }
    persist({ ...saved, plates: [...saved.plates, { weight, count: 2 }].sort((a, b) => b.weight - a.weight) });
    setNewPlate("");
    setStatus("");
  };
  const copy = async () => {
    const text = loadingInstructions(result, profile, unit, exerciseName);
    if (!text) return;
    if ((await copyText(text)) === "copied") { setCopied(true); setStatus("Loading instructions copied."); }
    else setStatus("Copying isn't allowed here. The instructions are on screen above.");
  };

  const loadBlock = (load: PlateLoad, label?: string) => <div className="plt-load">
    {label && <p className="plt-option-label">{label}</p>}
    <p className="plt-each"><b>Each side:</b> {eachSideText(load, unit)}</p>
    <p className="plt-total">{totalText(load, profile, unit)}</p>
    <PlateDiagram load={load} unit={unit} largest={largestPlate} />
  </div>;

  return <UtilitySheet eyebrow={exerciseName} title="Load the bar" labelId="plate-loader-title" onClose={onClose}>
    <div className="stp-body plt-body">
      <div className="plt-inputs">
        <label className="ut-field"><span>Target total <small>bar included</small></span>
          <span className="ut-input-unit"><input inputMode="decimal" autoComplete="off" aria-label={`Target total in ${unit}, bar included`} value={targets[unit]} placeholder={unit === "lb" ? "e.g. 185" : "e.g. 100"} aria-invalid={result.kind === "invalid" && result.field === "target" ? true : undefined} aria-describedby="plate-loader-message" onChange={(event) => { setTargets((current) => ({ ...current, [unit]: event.target.value })); setCopied(false); }} /><b>{unit}</b></span>
        </label>
        <fieldset className="ut-segment" aria-label="Unit">
          {(["lb", "kg"] as const).map((option) => <label key={option} className={option === unit ? "is-on" : ""}><input type="radio" name="plate-unit" checked={option === unit} onChange={() => chooseUnit(option)} /><span title={unitNames[option]}>{option}</span></label>)}
        </fieldset>
        <label className="ut-field"><span>Bar weight</span>
          <span className="ut-input-unit"><input inputMode="decimal" autoComplete="off" aria-label={`Bar weight in ${unit}`} value={barText[unit]} aria-invalid={result.kind === "invalid" && result.field === "bar" ? true : undefined} onChange={(event) => setBar(event.target.value)} /><b>{unit}</b></span>
        </label>
        <div className="ut-chips" role="group" aria-label="Common bars">{barPresets[unit].map((bar) => <button key={bar} type="button" className={profile.bar === bar ? "is-on" : ""} aria-pressed={profile.bar === bar} onClick={() => setBar(String(bar))}>{bar} {unit}</button>)}</div>
      </div>

      <section className="plt-result" aria-live="polite" id="plate-loader-message">
        {result.kind === "empty" && <p className="stp-note">Enter the total you want on the bar, including the bar itself.</p>}
        {result.kind === "invalid" && <p className="stp-warn" role="alert">{result.message}</p>}
        {result.kind === "below-bar" && <p className="stp-note">The {formatAmount(Math.round(result.base * 100))} {unit} {profile.collars.included ? "bar and collars already weigh" : "bar already weighs"} more than {formatAmount(Math.round(result.target * 100))} {unit}. Choose a lighter bar or a higher total.</p>}
        {result.kind === "exact" && loadBlock(result.load)}
        {result.kind === "inexact" && <>
          <p className="stp-note">{formatAmount(Math.round(result.target * 100))} {unit} can't be loaded exactly with the plates you have{!result.higher ? `; they reach at most ${formatAmount(Math.round(result.maxTotal * 100))} ${unit}` : ""}. The nearest you can load:</p>
          <div className="plt-options">
            {result.lower && loadBlock(result.lower, `Lower · ${formatAmount(Math.round(result.lower.total * 100))} ${unit}`)}
            {result.higher && loadBlock(result.higher, `Higher · ${formatAmount(Math.round(result.higher.total * 100))} ${unit}`)}
          </div>
        </>}
      </section>

      {(result.kind === "exact" || (result.kind === "inexact" && (result.lower || result.higher))) && <div className="stp-actions">
        <button type="button" className="stp-secondary" onClick={() => void copy()}>{copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}<span className="ml-2">{copied ? "Copied" : "Copy loading instructions"}</span></button>
      </div>}

      <details className="ut-disclosure">
        <summary>Available plates <small>{unit} · {saved.plates.filter((plate) => plate.count >= 2).map((plate) => formatAmount(Math.round(plate.weight * 100))).join(", ") || "none"}</small></summary>
        <div className="ut-disclosure-body">
          <p className="stp-note">Counts are individual plates. The bar is loaded the same on both sides, so plates are used in pairs; an odd one out stays on the rack.</p>
          <ul className="plt-stock">{saved.plates.map((plate) => <li key={plate.weight}>
            <b>{formatAmount(Math.round(plate.weight * 100))} {unit}</b>
            <span className="plt-stepper">
              <button type="button" aria-label={`One fewer ${formatAmount(Math.round(plate.weight * 100))} ${unit} plate`} onClick={() => setCount(plate.weight, plate.count - 1)} disabled={plate.count <= 0}><Minus className="h-4 w-4" aria-hidden="true" /></button>
              <input inputMode="numeric" aria-label={`How many ${formatAmount(Math.round(plate.weight * 100))} ${unit} plates`} value={String(plate.count)} onChange={(event) => { const value = Number(event.target.value.replace(/[^0-9]/g, "") || "0"); setCount(plate.weight, value); }} />
              <button type="button" aria-label={`One more ${formatAmount(Math.round(plate.weight * 100))} ${unit} plate`} onClick={() => setCount(plate.weight, plate.count + 1)}><Plus className="h-4 w-4" aria-hidden="true" /></button>
            </span>
            <small>{pairsText(plate.count)}</small>
            <button type="button" className="plt-remove" aria-label={`Remove ${formatAmount(Math.round(plate.weight * 100))} ${unit} plates`} onClick={() => removePlate(plate.weight)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
          </li>)}</ul>
          <div className="plt-add">
            <label className="ut-field"><span>Add a plate size</span><span className="ut-input-unit"><input inputMode="decimal" value={newPlate} placeholder={unit === "lb" ? "e.g. 1.25" : "e.g. 0.5"} onChange={(event) => setNewPlate(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPlate(); } }} /><b>{unit}</b></span></label>
            <button type="button" className="stp-secondary" onClick={addPlate}>Add</button>
          </div>
          <label className="ut-check"><input type="checkbox" checked={saved.collars.included} onChange={(event) => persist({ ...saved, collars: { ...saved.collars, included: event.target.checked } })} /><span>Count collars in the total</span></label>
          {saved.collars.included && <label className="ut-field"><span>Each collar</span><span className="ut-input-unit"><input inputMode="decimal" defaultValue={formatAmount(Math.round(saved.collars.each * 100))} onChange={(event) => { const value = parseAmount(event.target.value); if (value !== null) persist({ ...saved, collars: { included: true, each: value / 100 } }); }} /><b>{unit}</b></span></label>}
          <p className="stp-note">Pounds and kilograms are kept as separate sets of plates and never converted. Mixed lb and kg plates on one bar aren't supported here.</p>
          <p className="ut-save-state" role="status">{saveState === "saved" ? "Saved on this device." : saveState === "failed" ? "Couldn't save on this device. Your changes apply until you close this." : ""}</p>
        </div>
      </details>

      <p className="stp-note">A calculator only: nothing here is logged or changes your plan.</p>
      <p className="ut-status" role="status" aria-live="polite">{status}</p>
    </div>
  </UtilitySheet>;
}

/**
 * The loading drawn: one side large (what you load from the collar out), and on a wide screen
 * the whole bar. Labels carry the weights; colour only separates plates and follows no
 * competition scheme. Decorative: the text above says the same.
 */
function PlateDiagram({ load, unit, largest }: { load: PlateLoad; unit: PlateUnit; largest: number }) {
  const plates = load.perSide;
  const height = (weight: number) => 34 + Math.round(66 * Math.min(1, weight / largest));
  const width = (weight: number) => 12 + Math.round(10 * Math.min(1, weight / largest));
  const sideWidth = plates.reduce((sum, weight) => sum + width(weight) + 3, 0);
  const sideView = <svg className="plt-side" viewBox={`0 0 ${Math.max(140, sideWidth + 70)} 132`} role="presentation" aria-hidden="true">
    <rect x="0" y="58" width="24" height="16" rx="2" className="plt-shaft" />
    <rect x="24" y="44" width="6" height="44" rx="1" className="plt-collar" />
    <rect x="30" y="61" width={Math.max(110, sideWidth + 40)} height="10" rx="2" className="plt-sleeve" />
    {plates.reduce<{ x: number; nodes: ReactElement[] }>((acc, weight, index) => {
      const w = width(weight); const h = height(weight);
      acc.nodes.push(<g key={index}><rect x={acc.x} y={66 - h / 2} width={w} height={h} rx="3" className={`plt-plate plt-tone-${index % 2}`} /><text x={acc.x + w / 2} y={126} textAnchor="middle" className="plt-label">{formatAmount(Math.round(weight * 100))}</text></g>);
      acc.x += w + 3;
      return acc;
    }, { x: 34, nodes: [] }).nodes}
    {!plates.length && <text x="80" y="126" textAnchor="middle" className="plt-label">Empty bar</text>}
  </svg>;
  const half = sideWidth;
  const fullWidth = 2 * half + 260;
  const fullView = <svg className="plt-full" viewBox={`0 0 ${fullWidth} 112`} role="presentation" aria-hidden="true">
    <rect x="0" y="51" width={fullWidth} height="10" rx="3" className="plt-sleeve" />
    <rect x={half + 40} y="49" width={fullWidth - 2 * (half + 40)} height="14" rx="3" className="plt-shaft" />
    {[0, 1].map((sideIndex) => plates.map((weight, index) => {
      const offset = plates.slice(0, index).reduce((sum, item) => sum + width(item) + 3, 0);
      const w = width(weight); const h = height(weight) * 0.85;
      const x = sideIndex === 0 ? half + 34 - offset - w : fullWidth - half - 34 + offset;
      return <rect key={`${sideIndex}-${index}`} x={x} y={56 - h / 2} width={w} height={h} rx="3" className={`plt-plate plt-tone-${index % 2}`} />;
    }))}
    <text x={fullWidth / 2} y="106" textAnchor="middle" className="plt-label">{formatAmount(Math.round(load.total * 100))} {unit}</text>
  </svg>;
  return <div className="plt-diagram">{sideView}{fullView}</div>;
}
