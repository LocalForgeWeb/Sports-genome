import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Link2, Plus, RotateCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { savedShare, type PendingSharedSave } from "@/lib/shareLinks";
import { parseShareSnapshot } from "@shared/workoutShare";
import { shareScopeLine } from "@shared/workoutShareFormat";
import "../shared-link-import.css";

/**
 * A shared link pasted into Import plan, read from this app's own API and shown as the
 * workout it leads to: its title, how much is in it and who shared it, with one action,
 * Add to my plan. That hands it to the same dialog the link's own page opens (week, day,
 * add after or replace), so a link sent in a message is added without leaving the app.
 *
 * Every way a link can fail says what happened, in the same words as the shared page:
 * a link cut short, one its sender turned off, one that couldn't load (Try again) and a
 * share this version can't read.
 */
export function SharedLinkImportCard({ token, onAdd }: { token: string; onAdd: (pending: PendingSharedSave) => void }) {
  // The sender may have published a newer version; following it is the recipient's choice.
  const [shown, setShown] = useState(token);
  useEffect(() => { setShown(token); }, [token]);
  const query = trpc.shares.get.useQuery({ token: shown }, { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 });
  const data = query.data;
  const parsed = useMemo(() => (data?.state === "active" ? parseShareSnapshot(data.snapshot) : null), [data]);
  const snapshot = parsed?.ok ? parsed.snapshot : null;
  const saved = savedShare(shown);

  const frame = (body: React.ReactNode, tone: "info" | "warn" = "info") => <section className={`sli-card sli-${tone}`} aria-live="polite" aria-label="Shared link">
    <p className="sli-eyebrow"><Link2 className="h-4 w-4" aria-hidden="true" />Shared link</p>
    {body}
  </section>;

  if (query.isLoading) return frame(<p className="sli-line" role="status">Opening the shared workout…</p>);
  if (query.isError) {
    return frame(<>
      <p className="sli-title">This link couldn't load</p>
      <p className="sli-line">Check your connection and try again. The link itself is fine.</p>
      <button type="button" className="sli-secondary" onClick={() => void query.refetch()} disabled={query.isFetching}><RotateCw className="h-4 w-4" aria-hidden="true" />{query.isFetching ? "Trying again…" : "Try again"}</button>
    </>, "warn");
  }
  if (!data || data.state === "missing") {
    return frame(<>
      <p className="sli-title">This link doesn't lead to a workout</p>
      <p className="sli-line">It may have been copied only in part. Ask the person who sent it to send the link again.</p>
    </>, "warn");
  }
  if (data.state === "disabled") {
    return frame(<>
      <p className="sli-title">This shared workout is no longer available</p>
      <p className="sli-line">The person who shared it turned the link off.</p>
    </>, "warn");
  }
  if (!snapshot) {
    return frame(<>
      <p className="sli-title">This shared workout can't be read</p>
      <p className="sli-line">It's in a format this version of Sports Genome can't read. Ask the sender to share it again.</p>
    </>, "warn");
  }

  return frame(<>
    <p className="sli-title">{snapshot.title}</p>
    <p className="sli-line">{[shareScopeLine(snapshot), snapshot.attribution ? `Shared by ${snapshot.attribution}` : ""].filter(Boolean).join(" · ")}</p>
    {data.newerToken && <p className="sli-note"><AlertTriangle className="h-4 w-4" aria-hidden="true" /><span>The sender has shared a newer version. <button type="button" className="sli-inline" onClick={() => setShown(data.newerToken!)}>Use the newer version</button></span></p>}
    {saved && <p className="sli-note"><Check className="h-4 w-4" aria-hidden="true" /><span>You saved a copy to {saved.destination}.</span></p>}
    <button type="button" className="sli-primary" onClick={() => onAdd({ token: shown, version: data.version, snapshot })}><Plus className="h-4 w-4" aria-hidden="true" />{saved ? "Add another copy" : "Add to my plan"}</button>
    <p className="sli-line">You choose the week and day next. Nothing in your plan is replaced unless you choose that.</p>
  </>);
}
