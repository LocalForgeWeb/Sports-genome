/**
 * My setup: the athlete's own reminders of how they set an exercise up - seat notch, cable
 * height, handle, stance - kept per exercise, several per exercise (School gym, Home gym).
 *
 * These are personal notes, not technique guidance and not catalog data. They are separate
 * from a session's notes (how a workout felt) and from the exercise record (how the variation
 * is done). Choosing a setup is explicit: the newest is never picked for you, and choosing one
 * says nothing about which setup past sets were done on. Setups are private: no share link,
 * snapshot or export path reads this store.
 */

export type SetupSetting = { name: string; value: string };
export type SetupProfile = {
  id: string;
  catalogExerciseId: number;
  label: string;
  /** Typed by the athlete ("School gym"); never a GPS position. */
  location?: string;
  settings: SetupSetting[];
  /** "My note": free text, the athlete's words. */
  reminder?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};
export type SetupStore = { version: 1; setups: SetupProfile[]; selected: Record<string, string> };
export type SetupDraft = { label: string; location: string; settings: SetupSetting[]; reminder: string };

export const SETUP_STORE = "sg-setup-notebook-v1";
export const emptySetupStore: SetupStore = { version: 1, setups: [], selected: {} };
export const setupLimits = { label: 60, location: 60, settingName: 40, settingValue: 60, reminder: 600, settings: 12 } as const;

export function isSetupStore(value: unknown): value is SetupStore {
  const store = value as SetupStore;
  return Boolean(store && store.version === 1 && Array.isArray(store.setups) && store.selected && typeof store.selected === "object"
    && store.setups.every((setup) => setup && typeof setup.id === "string" && Number.isInteger(setup.catalogExerciseId) && typeof setup.label === "string" && Array.isArray(setup.settings)));
}

/** Setting names worth offering for an exercise's equipment; any name can be typed instead. */
export function suggestedSettings(equipment: string | undefined): string[] {
  const kind = (equipment ?? "").toLowerCase();
  if (kind === "cable") return ["Cable height", "Attachment", "Seat", "Stance", "Grip"];
  if (kind === "machine") return ["Seat", "Back pad", "Leg pad", "Handle", "Range limiter"];
  if (/barbell|trap bar|safety squat bar|landmine/.test(kind)) return ["Rack height", "Safety pins", "Grip width", "Stance", "Bench angle"];
  if (/dumbbell|kettlebell/.test(kind)) return ["Bench angle", "Grip", "Stance"];
  if (kind === "band") return ["Band", "Anchor height", "Stance"];
  return ["Position", "Grip", "Stance"];
}

const clip = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);

/** The draft as it will be stored, or the reason it can't be. Empty optional fields are left out. */
export function cleanDraft(draft: SetupDraft): { ok: true; value: Omit<SetupProfile, "id" | "catalogExerciseId" | "createdAt" | "updatedAt"> } | { ok: false; message: string } {
  const label = clip(draft.label, setupLimits.label);
  if (!label) return { ok: false, message: "Give the setup a name, like School gym." };
  const settings = draft.settings
    .map((setting) => ({ name: clip(setting.name, setupLimits.settingName), value: clip(setting.value, setupLimits.settingValue) }))
    .filter((setting) => setting.name && setting.value)
    .slice(0, setupLimits.settings);
  const location = clip(draft.location, setupLimits.location);
  const reminder = draft.reminder.trim().slice(0, setupLimits.reminder);
  return { ok: true, value: { label, settings, ...(location ? { location } : {}), ...(reminder ? { reminder } : {}) } };
}

export function draftFrom(setup?: SetupProfile): SetupDraft {
  return setup ? { label: setup.label, location: setup.location ?? "", settings: setup.settings.map((setting) => ({ ...setting })), reminder: setup.reminder ?? "" } : { label: "", location: "", settings: [], reminder: "" };
}

/** True when the draft holds anything typed beyond the setup it started from. */
export function draftChanged(draft: SetupDraft, from?: SetupProfile): boolean {
  const base = draftFrom(from);
  return JSON.stringify(draft) !== JSON.stringify(base);
}

export const setupsFor = (store: SetupStore, catalogExerciseId: number, { archived = false } = {}) =>
  store.setups.filter((setup) => setup.catalogExerciseId === catalogExerciseId && Boolean(setup.archivedAt) === archived).sort((a, b) => a.label.localeCompare(b.label) || a.createdAt.localeCompare(b.createdAt));

/** The setup the athlete chose for this exercise, if it is still active. Never a guess. */
export function selectedSetup(store: SetupStore, catalogExerciseId: number): SetupProfile | null {
  const id = store.selected[String(catalogExerciseId)];
  return store.setups.find((setup) => setup.id === id && setup.catalogExerciseId === catalogExerciseId && !setup.archivedAt) ?? null;
}

export function saveSetup(store: SetupStore, catalogExerciseId: number, draft: SetupDraft, options: { id?: string; newId: string; now: string; select?: boolean }): { ok: true; store: SetupStore; setup: SetupProfile } | { ok: false; message: string } {
  const cleaned = cleanDraft(draft);
  if (!cleaned.ok) return cleaned;
  const existing = options.id ? store.setups.find((setup) => setup.id === options.id) : undefined;
  const setup: SetupProfile = existing
    ? { ...existing, ...cleaned.value, location: cleaned.value.location, reminder: cleaned.value.reminder, updatedAt: options.now }
    : { id: options.newId, catalogExerciseId, ...cleaned.value, createdAt: options.now, updatedAt: options.now };
  if (!setup.location) delete setup.location;
  if (!setup.reminder) delete setup.reminder;
  const setups = existing ? store.setups.map((item) => (item.id === setup.id ? setup : item)) : [...store.setups, setup];
  const selected = options.select ? { ...store.selected, [String(catalogExerciseId)]: setup.id } : store.selected;
  return { ok: true, store: { ...store, setups, selected }, setup };
}

/** A copy to change for another place: a new id, " (copy)" on the name, nothing else shared. */
export function duplicateSetup(store: SetupStore, id: string, newId: string, now: string): { store: SetupStore; setup: SetupProfile } | null {
  const source = store.setups.find((setup) => setup.id === id);
  if (!source) return null;
  const setup: SetupProfile = { ...source, id: newId, label: clip(`${source.label} (copy)`, setupLimits.label), settings: source.settings.map((setting) => ({ ...setting })), createdAt: now, updatedAt: now };
  delete setup.archivedAt;
  return { store: { ...store, setups: [...store.setups, setup] }, setup };
}

export function selectSetup(store: SetupStore, catalogExerciseId: number, id: string | null): SetupStore {
  const selected = { ...store.selected };
  if (id) selected[String(catalogExerciseId)] = id;
  else delete selected[String(catalogExerciseId)];
  return { ...store, selected };
}

/** Archived setups are kept (and can be restored) but are never shown as the chosen one. */
export function archiveSetup(store: SetupStore, id: string, now: string): SetupStore {
  const setup = store.setups.find((item) => item.id === id);
  if (!setup) return store;
  const key = String(setup.catalogExerciseId);
  const selected = { ...store.selected };
  if (selected[key] === id) delete selected[key];
  return { ...store, setups: store.setups.map((item) => (item.id === id ? { ...item, archivedAt: now, updatedAt: now } : item)), selected };
}

export function restoreSetup(store: SetupStore, id: string, now: string): SetupStore {
  return {
    ...store,
    setups: store.setups.map((item) => {
      if (item.id !== id) return item;
      const restored: SetupProfile = { ...item, updatedAt: now };
      delete restored.archivedAt;
      return restored;
    }),
  };
}

/** "Seat 4 · Cable height low": the settings on one line, for the exercise record. */
export function settingsLine(setup: SetupProfile): string {
  return setup.settings.map((setting) => `${setting.name} ${setting.value}`).join(" · ");
}
