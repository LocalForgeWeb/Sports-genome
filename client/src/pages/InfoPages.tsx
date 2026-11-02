import { useEffect, useState } from "react";
import "@/your-data.css";
import { ArrowLeft, Copy } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { buildStamp, buildStampLabel } from "@/lib/buildStamp";
import { copyText } from "@/lib/workoutShare";
import { deviceStorageOwner, readOwnedList, unreadableRecords } from "@/lib/deviceRecordStore";
import { deviceWorkoutHistoryKey } from "@/lib/deviceWorkoutLog";

/**
 * Privacy and Support (iOS readiness audit, A04). Their own addresses, outside the workspace,
 * so they open with no sign-in, no profile and no working session: from About me, from the
 * sign-in screen, from a link in an App Store listing.
 *
 * The privacy text is drawn from what the app actually stores and sends (docs/ios-readiness/
 * data-inventory.md). What only the owner can say (who is responsible, how to reach them, the
 * minimum age) is marked as missing rather than invented; the page says it is a draft until
 * those are supplied and reviewed.
 */

/** Placeholders the owner must fill before release. Shown as missing, never as made-up details. */
export const ownerToSupply = {
  controller: "Not yet supplied: the name of the person or company responsible for Sports Genome.",
  contact: "Not yet supplied: the support email address.",
  minimumAge: "Not yet supplied: the minimum age for using Sports Genome.",
} as const;

function InfoShell({ title, children }: { title: string; children: React.ReactNode }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Sports Genome`;
    return () => { document.title = previous; };
  }, [title]);
  return <div className="info-page">
    <header className="info-page-header">
      <a className="info-page-back" href="/"><ArrowLeft className="h-5 w-5" aria-hidden="true" />Sports Genome</a>
      <BrandMark size={36} />
    </header>
    <main className="info-page-body">
      <h1>{title}</h1>
      {children}
      <nav className="info-page-links" aria-label="More information">
        <a href="/privacy">Privacy</a>
        <a href="/support">Support</a>
      </nav>
    </main>
  </div>;
}

export function PrivacyPage() {
  return <InfoShell title="Privacy">
    <p className="info-page-draft" role="note">Draft for the owner's review. It describes what this version of the app does; the details marked "not yet supplied" must be completed before release.</p>

    <h2>What stays on your device</h2>
    <p>Your workouts and every set in them, your plan, your profile (the name you choose, training experience, and, if you add them, body weight, sex for matching published studies, and birth year), your body-weight history, typed lifts, specialization targets and favourites are saved in this browser or app on this device. They are not sent anywhere unless one of the cases below applies.</p>

    <h2>What leaves your device</h2>
    <ul>
      <li><strong>Workout links you share.</strong> When you create a link, the workout you approved (its title, exercises, sets and reps) is stored on our server so anyone with the link can view it. It stays until you turn the link off (About me, Shared links). A secret kept on your device is what lets you turn it off.</li>
      <li><strong>Cloud sync, where your version has it.</strong> About me, Account &amp; sync, shows whether this version syncs. When it does, it creates an anonymous ID for this device, with no name or email, and stores your profile's sex, age in years, sport and default body weight, and your lifts (exercise, load, reps, date and body weight at the time), so they are kept if this device's storage is cleared. Anonymous comparison with other athletes happens only if you opt in.</li>
      <li><strong>Loading the app.</strong> Like any website, loading the app sends your IP address and browser details to the services that serve it: our host (Vercel), our database and file storage (Supabase), and the font and image hosts (Google Fonts, jsDelivr, GitHub). Our host keeps request logs for diagnosing faults.</li>
    </ul>

    <h2>What we don't do</h2>
    <p>This version runs no advertising, no analytics or tracking scripts, and does not sell or share your data. It does not read your location, contacts, photos or Apple Health.</p>

    <h2>Keeping and deleting it</h2>
    <p>What is on your device stays until you delete it. About me, Your data, has <strong>Save a backup</strong>, which gives you a file of everything, and <strong>Delete my data</strong>, which turns off your shared links, deletes any cloud copy, and removes your data from this device. Uninstalling the app or clearing the browser's site data also removes what is on the device; a backup file you saved is yours to keep or delete.</p>

    <h2>Who is responsible</h2>
    <p className="info-page-missing">{ownerToSupply.controller}</p>
    <p className="info-page-missing">{ownerToSupply.contact}</p>
    <p className="info-page-missing">{ownerToSupply.minimumAge}</p>
  </InfoShell>;
}

/** What Support can attach: the build and the device's shape, never a workout, a name or an id. */
export function diagnosticsText(now = new Date()): string {
  const stamp = buildStamp();
  const lines = [
    `Sports Genome ${buildStampLabel(stamp)} (${stamp.commit})`,
    `Time: ${now.toISOString()}`,
    `Page: ${typeof location === "undefined" ? "-" : location.pathname}`,
    `Browser: ${typeof navigator === "undefined" ? "-" : navigator.userAgent}`,
    `Screen: ${typeof window === "undefined" ? "-" : `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`}`,
    `Signed in: ${deviceStorageOwner() === null ? "no" : "yes"}`,
  ];
  try {
    lines.push(`Workouts saved on this device: ${readOwnedList(deviceWorkoutHistoryKey).length}`);
    lines.push(`Unreadable records kept for recovery: ${unreadableRecords().length}`);
  } catch {
    lines.push("Device storage: not available");
  }
  return lines.join("\n");
}

export function SupportPage() {
  const [diagnostics] = useState(() => diagnosticsText());
  const [status, setStatus] = useState("");
  const copy = async () => {
    const outcome = await copyText(diagnostics);
    setStatus(outcome === "copied" ? "Copied. Paste it into your message." : "Copying isn't allowed here. Select the text and copy it.");
  };
  return <InfoShell title="Support">
    <h2>Get help</h2>
    <p className="info-page-missing">{ownerToSupply.contact}</p>
    <p>Say what you were doing and what you expected. If you can, include the details below: they say which version you are running and nothing about your workouts or who you are.</p>

    <h2>Details to include</h2>
    <pre className="info-page-diagnostics" aria-label="Diagnostic details">{diagnostics}</pre>
    <button type="button" className="info-page-button" onClick={() => void copy()}><Copy className="h-5 w-5" aria-hidden="true" />Copy details</button>
    {status && <p role="status">{status}</p>}

    <h2>Your data</h2>
    <p>To save a backup, move your history to another device, or delete your data, open the app and go to About me, then Your data. If the app won't open, clearing this site's data in your browser settings removes everything it stored on this device.</p>
  </InfoShell>;
}
