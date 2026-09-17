export type DeviceStrengthObservation = {
  id: string;
  exerciseName: string;
  observedAt: string;
  measurementType: string;
  loadKg?: number;
  repetitions?: number;
  bodyMassKgAtTest?: number;
  equipment?: string;
  romStandard?: string;
  techniqueVariant?: string;
  tempo?: string;
  laterality?: "BILATERAL" | "LEFT" | "RIGHT";
  externalAssistance?: string;
  dataQuality?: string;
  referenceContextJson?: string;
  notes?: string;
};

export const deviceStrengthObservationKey = "sports-genome-device-strength-observations-v1";
export const deviceStrengthObservationEvent = "sports-genome:device-strength-observations";

export function loadDeviceStrengthObservations(): DeviceStrengthObservation[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(deviceStrengthObservationKey) || "[]");
    return Array.isArray(parsed) ? parsed as DeviceStrengthObservation[] : [];
  } catch {
    return [];
  }
}

export function saveDeviceStrengthObservations(observations: DeviceStrengthObservation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(deviceStrengthObservationKey, JSON.stringify(observations));
  window.dispatchEvent(new Event(deviceStrengthObservationEvent));
}

export function prependDeviceStrengthObservation(existing: DeviceStrengthObservation[], observation: DeviceStrengthObservation) {
  return [observation, ...existing.filter((item) => item.id !== observation.id)].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
}

export function setDeviceStrengthObservationBodyMass(existing: DeviceStrengthObservation[], observationId: string, bodyMassKgAtTest: number) {
  return existing.map((item) => item.id === observationId ? { ...item, bodyMassKgAtTest } : item);
}

/**
 * Removes one device-held observation.
 *
 * The account path has `repair.deleteStrengthObservation`; a direct-access
 * athlete's records never reach the server, so without this the pre-sign-in
 * athlete - who is most likely to be experimenting and mistyping - would be the
 * one person unable to take a number back.
 */
export function removeDeviceStrengthObservation(existing: DeviceStrengthObservation[], observationId: string) {
  return existing.filter((item) => item.id !== observationId);
}
