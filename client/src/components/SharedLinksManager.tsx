import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { copyText } from "@/lib/workoutShare";
import { forgetOwnedShare, markOwnedShareDisabled, ownedShares, randomKey, rememberOwnedShare, shareUrl, type OwnedShareRecord } from "@/lib/shareLinks";
import { shareExerciseCount } from "@shared/workoutShareFormat";
import type { ShareSnapshot } from "@shared/workoutShare";

/**
 * Shared by you: the links this device created, with what each one is now.
 *
 * The device that made a link holds its secret, so only it can turn the link off or
 * publish an updated version - there are no accounts to do it from anywhere else,
 * and the list says so. The server is the authority on each link's state; the list
 * is read from this device and checked against it, and still shows (marked as
 * unchecked) when the check cannot be made.
 *
 * `current` is the plan content open where this list is shown. A link made from that
 * same day or week can be updated to it: a new version at a new link, with the old
 * link pointing its readers to the new one.
 */
type ServerState = "active" | "disabled" | "missing" | "forbidden";
type Checked = { state: ServerState; version?: number; newerToken?: string | null };

const dateLabel = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const recordLine = (record: OwnedShareRecord) =>
  record.scope === "day" ? `Workout · ${record.exerciseCount} exercise${record.exerciseCount === 1 ? "" : "s"}` : `Week · ${record.dayCount} days · ${record.exerciseCount} exercises`;

export function SharedLinksManager({ current, headingLevel = 3 }: { current?: { key: string; snapshot: ShareSnapshot }; headingLevel?: 2 | 3 }) {
  const [records, setRecords] = useState<OwnedShareRecord[]>(() => ownedShares());
  const [checked, setChecked] = useState<Record<string, Checked>>({});
  const [checkState, setCheckState] = useState<"idle" | "checking" | "done" | "failed">("idle");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const mine = trpc.shares.mine.useMutation();
  const disable = trpc.shares.disable.useMutation();
  const create = trpc.shares.create.useMutation();
  const updateAttempt = useRef<Record<string, string>>({});
  const Heading = `h${headingLevel}` as const;

  const check = async (list = records) => {
    if (!list.length) return;
    setCheckState("checking");
    try {
      const result = await mine.mutateAsync({ items: list.map(({ token, manageSecret }) => ({ token, manageSecret })) });
      setChecked(Object.fromEntries(result.map((item) => [item.token, { state: item.state, version: item.version, newerToken: item.newerToken }])));
      // A link turned off elsewhere in this browser is recorded here too.
      result.filter((item) => item.state === "disabled").forEach((item) => { if (!list.find((record) => record.token === item.token)?.disabledAt) markOwnedShareDisabled(item.token); });
      setCheckState("done");
    } catch { setCheckState("failed"); }
  };
  useEffect(() => { void check(); }, []);

  const stateOf = (record: OwnedShareRecord): ServerState | "unchecked" => checked[record.token]?.state ?? (record.disabledAt ? "disabled" : "unchecked");

  const copyLink = async (record: OwnedShareRecord) => {
    if ((await copyText(shareUrl(record.token))) === "copied") { setCopied(record.token); setStatus(`Link to ${record.title} copied.`); }
    else setStatus("Copying isn't allowed here. Open the link and copy it from the address bar.");
  };

  const turnOff = async (record: OwnedShareRecord) => {
    setBusy(record.token);
    try {
      await disable.mutateAsync({ token: record.token, manageSecret: record.manageSecret });
      markOwnedShareDisabled(record.token);
      setRecords(ownedShares());
      setChecked((all) => ({ ...all, [record.token]: { ...all[record.token], state: "disabled" } }));
      setConfirming(null);
      setStatus(`${record.title} is turned off. People with the link now see that it's no longer available. Copies they saved stay theirs.`);
    } catch {
      setStatus("The link couldn't be turned off. Check your connection and try again.");
    } finally { setBusy(null); }
  };

  const publishUpdate = async (record: OwnedShareRecord) => {
    if (!current) return;
    setBusy(record.token);
    // One request key per update of this link, kept across retries so a repeat cannot publish twice.
    const requestKey = (updateAttempt.current[record.token] ??= randomKey(18));
    try {
      const result = await create.mutateAsync({ requestKey, manageSecret: record.manageSecret, snapshot: current.snapshot, supersedes: { token: record.token, manageSecret: record.manageSecret } });
      rememberOwnedShare({ token: result.token, manageSecret: record.manageSecret, title: current.snapshot.title, scope: current.snapshot.scope, version: result.version, createdAt: result.createdAt, exerciseCount: shareExerciseCount(current.snapshot), dayCount: current.snapshot.days.length, sourceKey: record.sourceKey });
      delete updateAttempt.current[record.token];
      const next = ownedShares();
      setRecords(next);
      setChecked((all) => ({ ...all, [record.token]: { ...all[record.token], state: all[record.token]?.state ?? "active", newerToken: result.token }, [result.token]: { state: "active", version: result.version, newerToken: null } }));
      setStatus(`Version ${result.version} published at a new link. The old link now points people to it.`);
    } catch {
      setStatus("The updated version couldn't be published. Check your connection and try again.");
    } finally { setBusy(null); }
  };

  const forget = (record: OwnedShareRecord) => {
    forgetOwnedShare(record.token);
    setRecords(ownedShares());
    setStatus(`${record.title} removed from this list.`);
  };

  return (
    <section className="shared-links" aria-labelledby="shared-links-title">
      <div className="shared-links-head">
        <Heading id="shared-links-title">Shared by you</Heading>
        {records.length > 0 && <button type="button" className="shared-links-refresh" onClick={() => void check()} disabled={checkState === "checking"}><RefreshCw className="h-4 w-4" aria-hidden="true" />{checkState === "checking" ? "Checking…" : "Check again"}</button>}
      </div>
      <p className="shared-links-note">Links made on this device. Only this device can turn them off or publish an update.</p>
      {checkState === "failed" && <p className="shared-links-warn" role="alert"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Couldn't check these links right now. What's shown is what this device last knew.</p>}
      {records.length === 0 ? <p className="shared-links-empty">You haven't shared a link from this device yet. Share a workout from Plan and it appears here.</p> : (
        <ul className="shared-links-list">
          {records.map((record) => {
            const state = stateOf(record);
            const newer = checked[record.token]?.newerToken;
            const canUpdate = Boolean(current && record.sourceKey && current.key === record.sourceKey && state === "active" && !newer);
            return (
              <li key={record.token} className="shared-link" data-state={state}>
                <div className="shared-link-main">
                  <b>{record.title}</b>
                  <small>{recordLine(record)} · {dateLabel(record.createdAt)}{record.version > 1 ? ` · Version ${record.version}` : ""}</small>
                  <span className="shared-link-state">{
                    state === "active" ? (newer ? "Active · a newer version replaces it" : "Active · anyone with the link can view")
                      : state === "disabled" ? "Turned off · the link shows it's no longer available"
                      : state === "missing" ? "Not found · this link no longer exists"
                      : state === "forbidden" ? "Can't be managed from this device"
                      : "Not checked yet"
                  }</span>
                </div>
                {state !== "missing" && state !== "disabled" && state !== "forbidden" && <div className="shared-link-actions">
                  <a className="shared-link-action" href={shareUrl(record.token)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />View</a>
                  <button type="button" className="shared-link-action" onClick={() => void copyLink(record)}>{copied === record.token ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied === record.token ? "Copied" : "Copy link"}</button>
                  {canUpdate && <button type="button" className="shared-link-action" disabled={busy === record.token} onClick={() => void publishUpdate(record)}>{busy === record.token ? "Publishing…" : "Publish updated version"}</button>}
                  {confirming !== record.token && <button type="button" className="shared-link-action is-danger" onClick={() => setConfirming(record.token)}>Turn off link</button>}
                </div>}
                {(state === "missing" || state === "disabled" || state === "forbidden") && <div className="shared-link-actions"><button type="button" className="shared-link-action" onClick={() => forget(record)}>Remove from list</button></div>}
                {confirming === record.token && state !== "disabled" && <div className="shared-link-confirm" role="group" aria-label={`Turn off ${record.title}`}>
                  <p>Turn off this link? People who open it will see that it's no longer available. Copies they already saved stay in their plans.</p>
                  <div className="shared-link-actions">
                    <button type="button" className="shared-link-action is-danger-solid" disabled={busy === record.token} onClick={() => void turnOff(record)}>{busy === record.token ? "Turning off…" : "Turn off link"}</button>
                    <button type="button" className="shared-link-action" onClick={() => setConfirming(null)}>Keep it on</button>
                  </div>
                </div>}
                {canUpdate === false && current && record.sourceKey === current.key && newer && <p className="shared-link-hint">Version {checked[newer]?.version ?? record.version + 1} is the current link for this.</p>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {status && <p className="shared-links-status" aria-hidden="true">{status}</p>}
    </section>
  );
}
