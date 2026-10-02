import { buildWorkoutPdf } from "@/lib/workoutPdf";
import { loadPdfLogo } from "@/lib/pdfBrandLogo";
import { exportFileName, exportTitle, shareMessage, type WorkoutExport } from "@/lib/workoutExport";

export type ShareOutcome = "shared" | "cancelled" | "saved" | "copied" | "failed";

/** The day's PDF as a file with a name a person can read. Waits briefly for the logo, then goes without it. */
export async function prepareWorkoutPdf(plan: WorkoutExport, weightUnit: "lb" | "kg"): Promise<File> {
  const logo = await loadPdfLogo();
  const bytes = buildWorkoutPdf(plan, { logo, weightUnit });
  return new File([bytes as Uint8Array<ArrayBuffer>], exportFileName(plan), { type: "application/pdf", lastModified: plan.generatedAt.getTime() });
}

type ShareCapableNavigator = Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };

/** Whether this browser can hand a PDF to the system share sheet (iOS and Android can; most desktops cannot). */
export function canShareFiles(file: File, nav: ShareCapableNavigator | undefined = typeof navigator === "undefined" ? undefined : navigator): boolean {
  try { return Boolean(nav?.share && nav.canShare?.({ files: [file] })); } catch { return false; }
}

/**
 * The system share sheet with the PDF attached and two short lines of text -
 * never the workout written out in the message (Oct 2 brief §6). Must be called
 * straight from the tap: Safari only opens the sheet inside a user gesture, so
 * the file is prepared before the athlete reaches the button.
 */
export async function shareWorkoutPdf(plan: WorkoutExport, file: File, nav: ShareCapableNavigator = navigator): Promise<ShareOutcome> {
  if (!canShareFiles(file, nav)) return savePdf(file);
  try {
    await nav.share!({ files: [file], title: exportTitle(plan), text: shareMessage(plan, { attached: true }) });
    return "shared";
  } catch (error) {
    // Dismissing the sheet is a choice, not a failure; nothing changed.
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    return "failed";
  }
}

/** Downloads the PDF under its own name (on iOS, Safari offers it to Files). */
export function savePdf(file: File): ShareOutcome {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return "failed";
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Long enough for the download to start everywhere; the bytes are small.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "saved";
}

export async function copyText(text: string): Promise<ShareOutcome> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return "copied"; }
  } catch { /* fall back below */ }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok ? "copied" : "failed";
  } catch {
    return "failed";
  }
}
