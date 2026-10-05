import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, X } from "lucide-react";
import type { DaySlot } from "@/lib/trainingDayPlan";
import { placeImportedDays } from "@/lib/trainingDayPlan";
import type { DayWriteMode, IncomingDay, IncomingDraftDay } from "@/lib/planImport";
import { exercises as catalog } from "@/lib/exerciseCatalog";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { trapTabWithin } from "@/lib/modalBackground";
import "../save-to-plan.css";

export type SaveWeekOption = { week: number; exists: boolean; current: boolean; dayCounts: Record<string, number> };
export type SaveRequest = { week: number; mode: DayWriteMode; writes: { slotIndex: number; day: IncomingDay }[] };
export type SaveOutcome =
  | { ok: true; week: number; slotIndex: number; destination: string; added: number; alreadyThere: string[] }
  | { ok: false; message: string };

/**
 * Where an incoming workout goes in your plan, chosen before anything changes.
 *
 * Used for a pasted workout and for a shared link's "Save a copy". It names the week
 * and the day each incoming day lands on, adds after what is already there unless the
 * athlete chooses to replace it (and then asks again, naming what will go), and will
 * not save while an exercise the catalog does not hold is still unresolved: it is
 * either matched to one the athlete picks or deliberately left out, never dropped.
 * Nothing is written until Save, and Save cannot run twice.
 */
export function SaveToPlanDialog({ heading, sourceTitle, sourceLine, attribution, days, slots, weeks, defaultWeek, alreadySaved, onSave, onOpen, onClose }: {
  heading: string;
  sourceTitle: string;
  sourceLine: string;
  attribution?: string;
  days: IncomingDraftDay[];
  slots: DaySlot[];
  weeks: SaveWeekOption[];
  defaultWeek: number;
  alreadySaved?: { destination: string; savedAt: string; week: number; slotIndex: number } | null;
  onSave: (request: SaveRequest) => SaveOutcome;
  onOpen: (week: number, slotIndex: number) => void;
  onClose: () => void;
}) {
  const [week, setWeek] = useState(defaultWeek);
  const initialPlacement = useMemo(() => {
    const { placements } = placeImportedDays(days.map((day) => day.label), slots.map((slot) => slot.day));
    return days.map((_, index) => placements.find((placement) => placement.pastedIndex === index)?.slotIndex ?? -1);
  }, [days, slots]);
  const [placement, setPlacement] = useState<number[]>(initialPlacement);
  const [mode, setMode] = useState<DayWriteMode>("append");
  const [resolution, setResolution] = useState<Record<string, number | "omit">>({});
  const [phase, setPhase] = useState<"choose" | "confirm" | "saved">("choose");
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  const [showForm, setShowForm] = useState(!alreadySaved);
  const saving = useRef(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    headingRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (isKeyForAnotherLayer(event, layerRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); return; }
      if (layerRef.current) trapTabWithin(event, layerRef.current);
    };
    window.addEventListener("keydown", onKey, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey, true); document.body.style.overflow = overflow; if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [phase]);

  const weekOption = weeks.find((option) => option.week === week) ?? weeks[0];
  const countIn = (slotIndex: number) => (slotIndex >= 0 ? weekOption?.dayCounts[slots[slotIndex]?.key] ?? 0 : 0);
  const unresolved = days.flatMap((day) => day.unresolved);
  const pendingResolution = unresolved.filter((item) => resolution[item.key] === undefined);
  const resolvedDays: IncomingDay[] = days.map((day) => ({
    label: day.label,
    context: day.context,
    items: [...day.items, ...day.unresolved.flatMap((item) => {
      const choice = resolution[item.key];
      const exercise = typeof choice === "number" ? catalog.find((entry) => entry.id === choice) : undefined;
      return exercise ? [{ exercise, prescription: item.prescription, rpe: item.rpe, rest: item.rest, notes: item.notes }] : [];
    })],
  }));
  const writes = resolvedDays.map((day, index) => ({ slotIndex: placement[index], day })).filter((write) => write.day.items.length > 0);
  const unplaced = writes.some((write) => write.slotIndex < 0);
  const replacing = mode === "replace" ? Array.from(new Set(writes.map((write) => write.slotIndex))).filter((slotIndex) => countIn(slotIndex) > 0) : [];
  const canSave = writes.length > 0 && !unplaced && pendingResolution.length === 0;
  const slotName = (slotIndex: number) => `${slots[slotIndex]?.ordinal} · ${slots[slotIndex]?.day}`;

  const save = () => {
    if (!canSave || saving.current) return;
    if (replacing.length && phase !== "confirm") { setPhase("confirm"); return; }
    saving.current = true;
    const result = onSave({ week, mode, writes });
    setOutcome(result);
    if (result.ok) setPhase("saved");
    else { saving.current = false; setPhase("choose"); }
  };

  return createPortal(<div className="stp-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={layerRef} className="stp-sheet sg-surface-dark" role="dialog" aria-modal="true" aria-labelledby="stp-title">
      <header className="stp-head">
        <div>
          <p className="stp-eyebrow">{heading}</p>
          <h2 id="stp-title" ref={headingRef} tabIndex={-1}>{phase === "saved" ? "Saved to your plan" : sourceTitle}</h2>
          {phase !== "saved" && <p className="stp-line">{[sourceLine, attribution ? `Shared by ${attribution}` : ""].filter(Boolean).join(" · ")}</p>}
        </div>
        <button type="button" className="stp-close" onClick={onClose} aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button>
      </header>

      {phase === "saved" && outcome?.ok ? <div className="stp-body" role="status">
        <p className="stp-success"><Check className="h-5 w-5" aria-hidden="true" /><span>Saved to <b>{outcome.destination}</b>. {outcome.added} exercise{outcome.added === 1 ? "" : "s"} added.</span></p>
        {outcome.alreadyThere.length > 0 && <p className="stp-note">Already in that day, so not added twice: {outcome.alreadyThere.join(", ")}. Your own sets for {outcome.alreadyThere.length === 1 ? "it are" : "them are"} kept; to take the shared ones instead, save again and choose Replace.</p>}
        <p className="stp-note">It's your copy now: edit it freely. The shared original doesn't change.</p>
        <div className="stp-actions"><button type="button" className="stp-primary" onClick={() => onOpen(outcome.week, outcome.slotIndex)}>Open workout</button><button type="button" className="stp-secondary" onClick={onClose}>Done</button></div>
      </div> : <div className="stp-body">
        {alreadySaved && <div className="stp-already">
          <p>You saved this on {new Date(alreadySaved.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} to <b>{alreadySaved.destination}</b>.</p>
          <div className="stp-actions"><button type="button" className="stp-primary" onClick={() => onOpen(alreadySaved.week, alreadySaved.slotIndex)}>Open saved copy</button>{!showForm && <button type="button" className="stp-secondary" onClick={() => setShowForm(true)}>Save another copy</button>}</div>
        </div>}

        {showForm && phase === "choose" && <>
          <fieldset className="stp-field">
            <legend>Week</legend>
            <div className="stp-chips">{weeks.map((option) => {
              const planned = Object.values(option.dayCounts).filter(Boolean).length;
              return <label key={option.week} className={`stp-chip ${option.week === week ? "is-on" : ""}`}><input type="radio" name="stp-week" checked={option.week === week} onChange={() => setWeek(option.week)} /><span>Week {option.week}</span><small>{!option.exists ? "new, empty" : option.current ? `this week · ${planned ? `${planned} day${planned === 1 ? "" : "s"} planned` : "empty"}` : planned ? `${planned} day${planned === 1 ? "" : "s"} planned` : "empty"}</small></label>;
            })}</div>
          </fieldset>

          <fieldset className="stp-field">
            <legend>{days.length > 1 ? "Days" : "Day"}</legend>
            {days.map((day, index) => <label key={`${day.label}-${index}`} className="stp-day">
              <span><b>{day.label}</b><small>{day.items.length + day.unresolved.length} exercise{day.items.length + day.unresolved.length === 1 ? "" : "s"}</small></span>
              <select value={placement[index]} onChange={(event) => setPlacement((current) => current.map((value, at) => (at === index ? Number(event.target.value) : value)))} aria-label={`Day in Week ${week} for ${day.label}`}>
                <option value={-1} disabled>Choose a day</option>
                {slots.map((slot) => <option key={slot.key} value={slot.index}>{slot.ordinal} · {slot.day} — {countIn(slot.index) ? `${countIn(slot.index)} planned` : "empty"}</option>)}
              </select>
            </label>)}
            {unplaced && <p className="stp-warn" role="alert"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Choose a day for every workout. You train {slots.length} day{slots.length === 1 ? "" : "s"} a week, so two can share one; they are added in order.</p>}
          </fieldset>

          <fieldset className="stp-field">
            <legend>If the day already has exercises</legend>
            <label className="stp-radio"><input type="radio" name="stp-mode" checked={mode === "append"} onChange={() => setMode("append")} /><span><b>Add after them</b><small>Nothing already planned changes.</small></span></label>
            <label className="stp-radio"><input type="radio" name="stp-mode" checked={mode === "replace"} onChange={() => setMode("replace")} /><span><b>Replace them</b><small>You'll be asked to confirm.</small></span></label>
          </fieldset>

          {unresolved.length > 0 && <fieldset className="stp-field">
            <legend>Not in this catalog</legend>
            <p className="stp-note">These exercises aren't in Sports Genome's catalog. Choose one to use instead, or leave them out — nothing is swapped without you.</p>
            {unresolved.map((item) => <div key={item.key} className="stp-missing">
              <p><b>{item.name}</b><small>{[item.prescription || "No sets given", item.rpe, item.rest ? `Rest ${item.rest}` : ""].filter(Boolean).join(" · ")}</small></p>
              <select value={resolution[item.key] === undefined ? "" : String(resolution[item.key])} onChange={(event) => setResolution((current) => ({ ...current, [item.key]: event.target.value === "omit" ? "omit" : Number(event.target.value) }))} aria-label={`What to do with ${item.name}`}>
                <option value="" disabled>Choose…</option>
                {item.candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>Use {candidate.name}</option>)}
                <option value="omit">Leave it out</option>
              </select>
            </div>)}
          </fieldset>}

          {outcome && !outcome.ok && <p className="stp-warn" role="alert"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{outcome.message}</p>}
          <div className="stp-actions">
            <button type="button" className="stp-primary" disabled={!canSave} onClick={save}>{mode === "replace" && replacing.length ? "Replace and save…" : `Save to Week ${week}`}</button>
            <button type="button" className="stp-secondary" onClick={onClose}>Cancel</button>
          </div>
          {!canSave && pendingResolution.length > 0 && <p className="stp-note">Resolve {pendingResolution.length} exercise{pendingResolution.length === 1 ? "" : "s"} above to save.</p>}
          {!canSave && pendingResolution.length === 0 && writes.length === 0 && <p className="stp-note">Every exercise is left out, so there's nothing to save. Choose one to use instead, or cancel.</p>}
        </>}

        {phase === "confirm" && <div className="stp-confirm" role="alertdialog" aria-labelledby="stp-confirm-title">
          <p id="stp-confirm-title"><AlertTriangle className="h-5 w-5" aria-hidden="true" /><b>Replace what's planned?</b></p>
          <ul>{replacing.map((slotIndex) => <li key={slotIndex}>Week {week} · {slotName(slotIndex)}: {countIn(slotIndex)} exercise{countIn(slotIndex) === 1 ? "" : "s"} will be removed</li>)}</ul>
          <p className="stp-note">Other days and weeks are not touched.</p>
          <div className="stp-actions"><button type="button" className="stp-danger" onClick={save}>Replace and save</button><button type="button" className="stp-secondary" onClick={() => setPhase("choose")}>Back</button></div>
        </div>}
      </div>}
    </div>
  </div>, document.body);
}
