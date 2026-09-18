import { useState } from "react";
import { CloudUpload, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { attachEmailToIdentity, upsertAthleteProfile, type IdentityState } from "@/lib/athleteIdentity";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

/**
 * What the athlete can see and decide about the account their lifts are saved
 * to. Three separate things, deliberately not merged:
 *
 *  1. Whether their history is attached to an account at all.
 *  2. Adding an email, which is about being able to reach it from another
 *     device — it does not move a single row, because the id is already theirs.
 *  3. Whether their lifts may join the anonymous pool used to build norms. That
 *     column defaults to false and stays false until they answer here; an app
 *     that assumed yes would be answering a consent question on their behalf.
 */
export function AthleteAccountCard({ identity, pending, optedIn, onOptIn }: {
  identity: IdentityState;
  pending: number;
  optedIn: boolean;
  onOptIn: (next: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [linking, setLinking] = useState(false);

  const statusCopy = identity.userId
    ? identity.anonymous
      ? "Saved to an account on this device. Add an email to reach it from another one."
      : "Saved to your account and reachable from any device you sign in on."
    : identity.reason === "anonymous_sign_ins_disabled"
      ? "Account sync is turned off for this build. Everything you log is still saved on this device."
      : identity.reason === "not_configured"
        ? "This build has no account service configured. Everything you log is saved on this device."
        : "Could not reach the account service. Everything you log is saved on this device and will sync when it is back.";

  const linkEmail = async () => {
    if (!email.trim()) return;
    setLinking(true);
    const result = await attachEmailToIdentity(email.trim());
    setLinking(false);
    if (!result.ok) return toast.error(result.message || "Could not add that email.");
    setEmail("");
    toast.success("Check that inbox to confirm. Your history stays exactly where it is.");
  };

  const setOptIn = async (next: boolean) => {
    emitInteractionFeedback();
    onOptIn(next);
    if (identity.userId) await upsertAthleteProfile(identity.userId, { benchmarkPoolOptIn: next });
  };

  return <section className="about-me-card about-me-account">
    <div className="about-me-card-head"><CloudUpload className="h-4 w-4" /><span>Your record &amp; account</span></div>
    <p className="about-me-account-status">{statusCopy}</p>
    {pending > 0 && <p className="about-me-account-pending" role="status">{pending} {pending === 1 ? "lift is" : "lifts are"} waiting to upload. They are already saved here.</p>}

    {identity.userId && identity.anonymous && <label className="about-me-account-email"><span>Add an email (optional)</span>
      <div className="about-me-inline">
        <input type="email" inputMode="email" value={email} placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} aria-label="Email address for this account" />
        <button type="button" onClick={linkEmail} disabled={!email.trim() || linking}>{linking ? "Adding" : "Add"}</button>
      </div>
      <small>This adds a way back into the account you already have. Nothing you have logged moves.</small>
    </label>}

    <div className="about-me-account-consent">
      <div><p className="metric-label"><ShieldCheck className="inline h-3.5 w-3.5" /> Help build the norms</p>
        <p>Let your lifts join an anonymous pool — sex, an age band, a weight band and your sport, never your name — so the app can eventually compare like with like. Off by default, and you can turn it off again whenever you want.</p></div>
      <button type="button" role="switch" aria-checked={optedIn} onClick={() => setOptIn(!optedIn)} className={`about-me-consent-toggle ${optedIn ? "is-on" : ""}`}>{optedIn ? "Sharing" : "Not sharing"}</button>
    </div>
  </section>;
}
