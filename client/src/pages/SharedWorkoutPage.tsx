import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Check, Copy, Printer, RotateCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { dismissBootSplash } from "@/lib/bootSplash";
import { copyText } from "@/lib/workoutShare";
import { savedShare, setPendingSharedSave, shareUrl } from "@/lib/shareLinks";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";
import { SharedWorkoutView } from "@/components/SharedWorkoutView";
import { parseShareSnapshot } from "@shared/workoutShare";
import { shareSnapshotText } from "@shared/workoutShareFormat";
import "../shared-page.css";

/**
 * A shared workout at /s/<token>: readable by anyone with the link, no account needed.
 *
 * The workout is first - its name, who shared it if they said, then every exercise
 * in order with its prescription. One main action, Save a copy, hands the workout to
 * the app, which asks where it goes (week, day, add or replace) before anything in
 * the plan changes. Copy as text and Print are the ways to take it anywhere else.
 *
 * Every way a link can fail says what happened and what to do: a link that never
 * existed, one its sender turned off, a page that couldn't load (with Try again), and
 * a share in a format this version can't read. None of them is a blank page.
 */
const tokenShape = /^[A-Za-z0-9_-]{20,64}$/;

function setHead(title: string) {
  document.title = title;
  // The server sends noindex with the page; this keeps it if the page was reached in-app.
  if (!document.querySelector('meta[name="robots"]')) {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
  }
}

function PageFrame({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return <div className="sp-shell">
    <header className="sp-bar">
      <a className="sp-brand" href="/" aria-label="Sports Genome"><img src={sportsGenomeAssets.officialLogo} alt="" width={36} height={36} /><span>Sports Genome</span></a>
      <a className="sp-open" href="/" aria-label="Open Sports Genome"><span className="sp-open-long">Open Sports Genome</span><span className="sp-open-short">Open app</span></a>
    </header>
    <main className="sp-main" aria-busy={busy || undefined}>{children}</main>
  </div>;
}

function Notice({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="sp-state">
    <h1>{title}</h1>
    <div className="sp-state-body">{children}</div>
    <div className="sp-state-actions">{action}<a className="sp-secondary" href="/">Open Sports Genome</a></div>
  </section>;
}

export default function SharedWorkoutPage({ params }: { params: { token: string } }) {
  const token = params.token ?? "";
  const valid = tokenShape.test(token);
  const [, navigate] = useLocation();
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const query = trpc.shares.get.useQuery({ token }, { enabled: valid, retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 });

  // The intro is for opening the app, not for reading a link someone sent.
  useEffect(() => { dismissBootSplash({ immediate: true }); }, []);

  const data = query.data;
  const parsed = useMemo(() => (data?.state === "active" ? parseShareSnapshot(data.snapshot) : null), [data]);
  const snapshot = parsed?.ok ? parsed.snapshot : null;
  const saved = valid ? savedShare(token) : null;

  useEffect(() => {
    if (snapshot) setHead(`${snapshot.title} · Shared workout · Sports Genome`);
    else if (data?.state === "disabled") setHead("Shared workout no longer available · Sports Genome");
    else setHead("Shared workout · Sports Genome");
  }, [snapshot, data?.state]);

  useEffect(() => { setCopied(false); setStatus(""); }, [token]);

  if (!valid || data?.state === "missing") {
    return <PageFrame><Notice title="This link doesn't lead to a workout">
      <p>It may have been mistyped, or copied only in part. Ask the person who sent it to send the link again.</p>
    </Notice></PageFrame>;
  }
  if (query.isLoading) {
    return <PageFrame busy>
      <div className="sp-skeleton" aria-hidden="true"><span className="sp-skel-line is-short" /><span className="sp-skel-line is-title" /><span className="sp-skel-line" /><span className="sp-skel-block" /><span className="sp-skel-row" /><span className="sp-skel-row" /><span className="sp-skel-row" /></div>
      <p className="sr-only" role="status">Loading the shared workout…</p>
    </PageFrame>;
  }
  if (query.isError) {
    const unavailable = /isn't available|not available/i.test(query.error?.message ?? "");
    return <PageFrame><Notice title="This workout couldn't load" action={<button type="button" className="sp-primary" onClick={() => void query.refetch()} disabled={query.isFetching}><RotateCw className="h-5 w-5" aria-hidden="true" />{query.isFetching ? "Trying again…" : "Try again"}</button>}>
      <p>{unavailable ? "Shared workouts can't be opened right now. The link is fine — try again in a few minutes." : "Check your connection and try again. The link itself is fine."}</p>
    </Notice></PageFrame>;
  }
  if (data?.state === "disabled") {
    return <PageFrame><Notice title="This shared workout is no longer available">
      <p>The person who shared it turned the link off. Copies that were already saved to plans aren't affected.</p>
    </Notice></PageFrame>;
  }
  if (!snapshot || data?.state !== "active") {
    return <PageFrame><Notice title="This shared workout can't be shown">
      <p>It's in a format this version of Sports Genome can't read. Reloading the page may fix it; if it doesn't, ask the sender to share it again.</p>
    </Notice></PageFrame>;
  }

  const saveCopy = () => {
    setPendingSharedSave({ token, version: data.version, snapshot });
    navigate("/");
  };
  const copyAsText = async () => {
    if ((await copyText(shareSnapshotText(snapshot, shareUrl(token)))) === "copied") { setCopied(true); setStatus("Copied as text. Paste it into Import plan in Sports Genome, or into any notes app."); }
    else setStatus("Copying isn't allowed here. Use Print to save it as a PDF instead.");
  };

  const actions = <div className="sp-actions">
    {data.newerToken && <p className="sp-newer"><AlertTriangle className="h-5 w-5" aria-hidden="true" /><span>The sender has shared a newer version of this. <a href={`/s/${data.newerToken}`} onClick={(event) => { event.preventDefault(); navigate(`/s/${data.newerToken}`); }}>View the newer version</a></span></p>}
    {saved && <p className="sp-saved"><Check className="h-5 w-5" aria-hidden="true" /><span>You saved a copy to {saved.destination}.</span></p>}
    <button type="button" className="sp-primary" onClick={saveCopy}>{saved ? "Save another copy" : "Save a copy to my plan"}</button>
    <p className="sp-explain">You choose the week and day next. Exercises are added after what's there — nothing in your plan is replaced unless you choose that.</p>
    <div className="sp-more">
      <button type="button" className="sp-secondary" onClick={() => void copyAsText()}>{copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}{copied ? "Copied as text" : "Copy as text"}</button>
      <button type="button" className="sp-secondary" onClick={() => window.print()}><Printer className="h-5 w-5" aria-hidden="true" />Print or save PDF</button>
    </div>
    <p className="sp-status" role="status" aria-live="polite">{status}</p>
  </div>;

  return <PageFrame>
    <SharedWorkoutView snapshot={snapshot} mode="page" createdAt={data.createdAt} version={data.version} actions={actions} headingLevel={1} />
    <p className="sp-print-source">Shared from Sports Genome · {shareUrl(token)}</p>
  </PageFrame>;
}
