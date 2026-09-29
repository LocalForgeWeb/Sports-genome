import { useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, ArrowRight, Dumbbell, Home, LineChart, X } from "lucide-react";

/**
 * First-run guide.
 *
 * The previous version had ten modal steps and roughly forty instructions before
 * the athlete had done anything, and seven of them pointed at a "left rail" that
 * does not exist anywhere in this app - the navigation is a bottom tab bar. It also
 * never mentioned Strength Genome, which is where a logged lift actually goes.
 *
 * This one is four steps, each naming a real destination and one thing to do there.
 * Every step opens that destination, so the guide is a way into the app rather than
 * reading to get through first. Anything deeper belongs beside the feature it
 * explains, not in a modal before the athlete has context for it.
 */
const steps = [
  {
    icon: Home,
    tab: "Home",
    title: "Start on Home",
    copy: "Home answers one question: what deserves your attention right now. It shows a single priority, your week so far, and the next action.",
    task: "Read the priority card, then open what it points you at.",
    view: "command",
  },
  {
    icon: Dumbbell,
    tab: "Train",
    title: "Build and run a session",
    copy: "Train is where a workout gets designed from your sport and equipment, then logged set by set while you do it.",
    task: "Stage a session, then start it when you are ready to lift.",
    view: "day-plan",
  },
  {
    icon: Activity,
    tab: "Body Lab",
    title: "See what you are loading",
    copy: "Body Lab maps a movement onto the body. Tap any muscle for its role in that action and the reasoning behind it.",
    task: "Tap a highlighted muscle to open its role and reasoning.",
    view: "body",
  },
  {
    icon: LineChart,
    tab: "Progress",
    title: "Track what changes",
    copy: "Log the same lift twice and Progress starts tracking your own change over time. Where a reviewed study matches your exact test, a comparison appears too.",
    task: "Log your first lift so there is something to track.",
    view: "strength",
  },
] as const;

export function FeatureTour({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: string) => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const openCurrent = () => { onNavigate(current.view); onClose(); };
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  // Home passes a fresh onClose on every render; reading it through a ref keeps
  // the effect below from re-running and pulling focus back to Close each time.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus moves into the guide, Escape closes it, Tab stays inside it, and focus
  // goes back to whatever opened it - the way every other layer over the app behaves.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !cardRef.current) return;
      const buttons = Array.from(cardRef.current.querySelectorAll<HTMLElement>("button"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      // Also covers focus dropping to the page when Next or Back unmounts under it.
      if (!(active instanceof Node) || !cardRef.current.contains(active)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // The opener belongs to this one presentation of the guide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="feature-tour-layer" role="dialog" aria-modal="true" aria-labelledby="feature-tour-title">
    <section ref={cardRef} className="feature-tour-card">
      <button ref={closeRef} type="button" onClick={onClose} className="feature-tour-close" aria-label="Close guide"><X className="h-4 w-4" aria-hidden="true" /></button>

      <div className="feature-tour-icon"><Icon className="h-6 w-6" aria-hidden="true" /></div>
      <p className="metric-label">{current.tab} tab · {step + 1} of {steps.length}</p>
      <h2 id="feature-tour-title">{current.title}</h2>
      <p className="feature-tour-copy">{current.copy}</p>

      {/* One thing to do, not a checklist. A step the athlete can finish is worth
          more than three they will skim. */}
      <p className="feature-tour-task"><span>Try this</span>{current.task}</p>

      <button type="button" onClick={openCurrent} className="feature-tour-open">
        Open {current.tab} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="feature-tour-progress" aria-hidden="true">
        {steps.map((item, index) => <span
          key={item.title}
          className={index === step ? "feature-tour-progress-active" : index < step ? "feature-tour-progress-done" : ""}
        />)}
      </div>

      <div className="feature-tour-actions">
        <button type="button" onClick={onClose} className="feature-tour-skip">{isLast ? "Close" : "Skip guide"}</button>
        <div className="flex gap-2">
          {step > 0 && <button type="button" onClick={() => setStep(value => value - 1)} className="feature-tour-back">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>}
          {!isLast && <button type="button" onClick={() => setStep(value => value + 1)} className="feature-tour-next">
            Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>}
        </div>
      </div>
    </section>
  </div>;
}
