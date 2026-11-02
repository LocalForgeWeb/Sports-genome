import { useEffect, useRef, useState } from "react";
import "@/your-data.css";
import { Download, FileUp, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { trpc } from "@/lib/trpc";
import { platform } from "@/lib/platform";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { deviceStorageOwner, discardUnreadableRecord, unreadableRecords, type UnreadableRecord } from "@/lib/deviceRecordStore";
import {
  applyBackupImport, backupCounts, backupFileName, buildDeviceBackup, importConflicts, previewBackupImport, readBackup, restoreImportSnapshot, serializeBackup,
  type BackupPreview, type DeviceBackup, type ImportResult,
} from "@/lib/deviceBackup";
import { deleteAthleteData, type DeletionReport, type OwnedLink } from "@/lib/deviceDataDeletion";
import { deviceWorkoutHistoryEvent } from "@/lib/deviceWorkoutLog";

/**
 * "Your data" in About me (iOS readiness audit, A03 and A04): a restorable backup, a restore with
 * a preview of exactly what would change, the recovery of anything the device could not read,
 * and deleting the athlete's data. Everything is asked in place; the one dialog is the
 * confirmation of the deletion, which is the destructive step.
 */

type Restore =
  | { step: "idle" }
  | { step: "error"; message: string }
  | { step: "preview"; backup: DeviceBackup; preview: BackupPreview; replaceDocuments: boolean; fileName: string }
  | { step: "done"; result: Extract<ImportResult, { ok: true }> }
  | { step: "undone" };

const refusal: Record<string, string> = {
  "too-large": "That file is far larger than any backup. Nothing was changed.",
  "not-json": "That file isn't a Sports Genome backup (it isn't readable data). Nothing was changed.",
  "not-a-backup": "That file isn't a Sports Genome backup. Nothing was changed.",
  "newer-version": "That backup was made by a newer version of Sports Genome. Update the app, then try again. Nothing was changed.",
  malformed: "That backup is damaged and can't be read safely. Nothing was changed.",
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function summaryOf(preview: BackupPreview): string[] {
  const lines: string[] = [];
  for (const item of preview.lists) {
    if (!item.add && !item.same && !item.conflicts && !item.invalid) continue;
    const parts = [
      item.add ? `${item.add} to add` : "",
      item.same ? `${item.same} already here` : "",
      item.conflicts ? `${item.conflicts} different from this device's (kept aside, not replaced)` : "",
      item.invalid ? `${item.invalid} unreadable (skipped)` : "",
    ].filter(Boolean);
    lines.push(`${item.label[0].toUpperCase()}${item.label.slice(1)}: ${parts.join(", ")}`);
  }
  for (const item of preview.documents) {
    if (item.action === "add") lines.push(`${item.label[0].toUpperCase()}${item.label.slice(1)}: from the backup (this device has none)`);
    if (item.action === "replace") lines.push(`${item.label[0].toUpperCase()}${item.label.slice(1)}: replaced by the backup's (this device's is kept aside)`);
    if (item.action === "keep-device") lines.push(`${item.label[0].toUpperCase()}${item.label.slice(1)}: this device's is kept`);
  }
  return lines;
}

export function YourDataPanel({ cloudUserId = null }: { cloudUserId?: string | null }) {
  const [status, setStatus] = useState("");
  const [restore, setRestore] = useState<Restore>({ step: "idle" });
  const [unreadable, setUnreadable] = useState<UnreadableRecord[]>(() => unreadableRecords());
  const [discarded, setDiscarded] = useState<UnreadableRecord | null>(null);
  const [conflicts, setConflicts] = useState(() => importConflicts().length);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [report, setReport] = useState<DeletionReport | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const disable = trpc.shares.disable.useMutation();

  useEffect(() => {
    const refresh = () => { setUnreadable(unreadableRecords()); setConflicts(importConflicts().length); };
    window.addEventListener(deviceWorkoutHistoryEvent, refresh);
    return () => window.removeEventListener(deviceWorkoutHistoryEvent, refresh);
  }, []);

  const saveText = (name: string, text: string) => platform().saveFile(new File([text], name, { type: "application/json" }));

  const saveBackup = () => {
    const backup = buildDeviceBackup();
    const counts = backupCounts(backup);
    const saved = saveText(backupFileName(), serializeBackup(backup));
    setStatus(saved === "saved"
      ? `Backup saved as ${backupFileName()}${counts.length ? `: ${counts.map((item) => item.label).join(", ")}` : ""}. Keep it somewhere you can reach from your other device.`
      : "The backup couldn't be saved on this device. Nothing was changed.");
  };

  const chooseFile = async (file: File | undefined) => {
    if (!file) return;
    setStatus("");
    let textContent = "";
    try { textContent = await file.text(); } catch { setRestore({ step: "error", message: "That file couldn't be opened. Nothing was changed." }); return; }
    const read = readBackup(textContent);
    if (!read.ok) { setRestore({ step: "error", message: refusal[read.reason] }); return; }
    setRestore({ step: "preview", backup: read.backup, preview: previewBackupImport(read.backup), replaceDocuments: false, fileName: file.name });
  };

  const setReplace = (replaceDocuments: boolean) => {
    if (restore.step !== "preview") return;
    setRestore({ ...restore, replaceDocuments, preview: previewBackupImport(restore.backup, { replaceDocuments }) });
  };

  const runImport = () => {
    if (restore.step !== "preview") return;
    const result = applyBackupImport(restore.backup, { replaceDocuments: restore.replaceDocuments });
    if (!result.ok) {
      setRestore({ step: "error", message: result.reason === "nothing-to-import" ? "Everything in that backup is already on this device. Nothing was changed." : "This device refused to save the import (it may be full). Nothing was changed." });
      return;
    }
    setRestore({ step: "done", result });
    setConflicts(importConflicts().length);
  };

  const undoImport = () => {
    if (restore.step !== "done") return;
    const ok = restoreImportSnapshot(restore.result.snapshot);
    setRestore(ok ? { step: "undone" } : { step: "error", message: "Undo couldn't finish: this device refused a write. Reload and check your workouts." });
    setConflicts(importConflicts().length);
  };

  const downloadUnreadable = (record: UnreadableRecord) => {
    const saved = platform().saveFile(new File([record.raw], `sports-genome-unreadable-${record.savedAt.slice(0, 10)}.txt`, { type: "text/plain" }));
    setStatus(saved === "saved" ? "The unreadable copy was saved as a file, exactly as it was found." : "The copy couldn't be saved on this device.");
  };

  const discardUnreadable = (record: UnreadableRecord) => {
    if (!discardUnreadableRecord(record.key)) { setStatus("That copy couldn't be removed."); return; }
    setDiscarded(record);
    setUnreadable(unreadableRecords());
  };

  const undoDiscard = () => {
    if (!discarded) return;
    try { window.localStorage.setItem(discarded.key, JSON.stringify({ savedAt: discarded.savedAt, raw: discarded.raw })); } catch { setStatus("Undo couldn't finish: this device refused the write."); return; }
    setDiscarded(null);
    setUnreadable(unreadableRecords());
  };

  const downloadConflicts = () => {
    const saved = saveText(`sports-genome-import-differences-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(importConflicts(), null, 1));
    setStatus(saved === "saved" ? "The records kept aside were saved as a file." : "The file couldn't be saved on this device.");
  };

  const disableLink = async (link: OwnedLink) => {
    if (link.disabledAt) return true;
    try {
      await disable.mutateAsync({ token: link.token, manageSecret: link.manageSecret });
      return true;
    } catch (error) {
      // Already gone, or not this device's to turn off: nothing a retry could change.
      const code = (error as { data?: { code?: string } } | null)?.data?.code;
      return code === "NOT_FOUND" || code === "FORBIDDEN";
    }
  };

  const runDeletion = async () => {
    setConfirming(false);
    setDeleting(true);
    const supabase = getSupabaseClient();
    const result = await deleteAthleteData({
      storage: window.localStorage,
      owner: deviceStorageOwner(),
      disableLink,
      cloud: supabase && cloudUserId ? {
        userId: cloudUserId,
        deleteRows: async (table, userId) => { const { error } = await supabase.from(table).delete().eq("user_id", userId); return !error; },
        signOut: async () => { const { error } = await supabase.auth.signOut(); return !error; },
      } : null,
    });
    setDeleting(false);
    setReport(result);
  };

  const preview = restore.step === "preview" ? restore.preview : null;
  const choice = preview?.documents.some((item) => item.action === "keep-device" || item.action === "replace");

  return <div className="your-data">
    <p className="about-me-group-note">Your workouts, plan and profile are saved on this device. A backup is a file you keep: it is how you move them to the iPhone app or another browser, and how you get them back if this device's storage is cleared.</p>

    <div className="your-data-actions">
      <button type="button" className="your-data-primary" onClick={saveBackup}><Download className="h-5 w-5" aria-hidden="true" />Save a backup</button>
      <button type="button" className="your-data-secondary" onClick={() => fileInput.current?.click()}><FileUp className="h-5 w-5" aria-hidden="true" />Restore from a backup</button>
      <input ref={fileInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { void chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
    </div>
    {status && <p className="your-data-status" role="status">{status}</p>}

    {restore.step === "error" && <p className="your-data-status your-data-refused" role="alert">{restore.message}</p>}
    {restore.step === "preview" && preview && <section className="your-data-preview" aria-label="What this backup would change">
      <h3>{restore.fileName}</h3>
      <p className="your-data-meta">Made {new Date(preview.exportedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}{preview.build !== "unknown" ? ` · build ${preview.build}` : ""}</p>
      <ul>{summaryOf(preview).map((line) => <li key={line}>{line}</li>)}</ul>
      {choice && <label className="your-data-check"><input type="checkbox" checked={restore.replaceDocuments} onChange={(event) => setReplace(event.target.checked)} /><span>Use the backup's profile and plan instead of this device's</span></label>}
      {!preview.changes && <p className="your-data-status">Everything in this backup is already on this device.</p>}
      <div className="your-data-actions">
        <button type="button" className="your-data-primary" disabled={!preview.changes} onClick={runImport}>Import</button>
        <button type="button" className="your-data-secondary" onClick={() => setRestore({ step: "idle" })}>Cancel</button>
      </div>
    </section>}
    {restore.step === "done" && <div className="your-data-status" role="status">
      <p>Imported {plural(restore.result.added, "record")}{restore.result.conflictsKept ? `; ${plural(restore.result.conflictsKept, "record")} that differed from this device's ${restore.result.conflictsKept === 1 ? "was" : "were"} kept aside` : ""}.</p>
      <div className="your-data-actions">
        {restore.result.needsReload && <button type="button" className="your-data-primary" onClick={() => window.location.reload()}>Reload to open the imported plan</button>}
        <button type="button" className="your-data-secondary" onClick={undoImport}><Undo2 className="h-5 w-5" aria-hidden="true" />Undo</button>
      </div>
    </div>}
    {restore.step === "undone" && <p className="your-data-status" role="status">The import was undone. This device is as it was.</p>}

    {(unreadable.length > 0 || discarded) && <section className="your-data-recovery" aria-label="Data this device couldn't read">
      <h3><ShieldAlert className="h-5 w-5" aria-hidden="true" />Some saved data couldn't be read</h3>
      <p>It has been kept exactly as it was found, and nothing was saved over it. Save a copy to send to support, or remove it once you have what you need.</p>
      {unreadable.map((record) => <div key={record.key} className="your-data-actions">
        <button type="button" className="your-data-secondary" onClick={() => downloadUnreadable(record)}><Download className="h-5 w-5" aria-hidden="true" />Save the copy ({Math.max(1, Math.round(record.bytes / 1024))} KB)</button>
        <button type="button" className="your-data-secondary" onClick={() => discardUnreadable(record)}>Remove it</button>
      </div>)}
      {discarded && <p className="your-data-status" role="status">Removed. <button type="button" className="your-data-inline" onClick={undoDiscard}>Undo</button></p>}
    </section>}

    {conflicts > 0 && <p className="your-data-status">{plural(conflicts, "imported record")} differed from this device's and {conflicts === 1 ? "is" : "are"} kept aside. <button type="button" className="your-data-inline" onClick={downloadConflicts}>Save them as a file</button></p>}

    <div className="your-data-delete">
      {!deleteOpen && !report && <button type="button" className="your-data-danger" onClick={() => setDeleteOpen(true)}><Trash2 className="h-5 w-5" aria-hidden="true" />Delete my data</button>}
      {deleteOpen && !report && <section aria-label="Delete my data">
        <h3>Delete my data</h3>
        <ul>
          <li>Removed from this device: every workout, typed lift and body weight, your plan, profile, favourites and specialization targets, and anything waiting to upload.</li>
          <li>Turned off: every workout link you shared from this device. Copies other people already saved stay theirs.</li>
          <li>{cloudUserId ? "Deleted from the cloud: this device's synced profile and lifts, then this device is signed out." : "Nothing of yours is stored in the cloud from this device."}</li>
          <li>Kept: app settings like the theme. Nothing is kept for later recovery, so save a backup first if you may want it back.</li>
        </ul>
        <div className="your-data-actions">
          <button type="button" className="your-data-secondary" onClick={saveBackup}><Download className="h-5 w-5" aria-hidden="true" />Save a backup first</button>
          <button type="button" className="your-data-danger" disabled={deleting} onClick={() => setConfirming(true)}><Trash2 className="h-5 w-5" aria-hidden="true" />{deleting ? "Deleting…" : "Delete everything"}</button>
          <button type="button" className="your-data-secondary" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</button>
        </div>
      </section>}
      {report && <section className="your-data-status" role="status" aria-label="Deletion result">
        <h3>{report.complete ? "Your data was deleted" : "Not everything was deleted"}</h3>
        <ul>{report.steps.map((step) => <li key={step.step}>{step.detail}</li>)}</ul>
        <div className="your-data-actions">
          {report.complete
            ? <button type="button" className="your-data-primary" onClick={() => window.location.assign("/")}>Start fresh</button>
            : <button type="button" className="your-data-danger" disabled={deleting} onClick={() => void runDeletion()}>{deleting ? "Trying again…" : "Try again"}</button>}
        </div>
      </section>}
    </div>
    {confirming && <ConfirmDialog title="Delete all your data?" body="This removes your workouts, plan and profile from this device and turns off your shared links. It can't be undone." confirmLabel="Delete everything" onCancel={() => setConfirming(false)} onConfirm={() => void runDeletion()} />}
  </div>;
}
