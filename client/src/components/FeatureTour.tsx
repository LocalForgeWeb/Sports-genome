import { useState } from "react";
import { Activity, ArrowLeft, ArrowRight, Dna, Move3d, SlidersHorizontal, Sparkles, Target, X } from "lucide-react";

/** Modern Kinetic Field Manual: a concise, optional guide that turns the athlete profile into clear next actions. */
const steps = [
  { icon: Target, title: "Command Center", copy: "Start here for today’s sport lens, priority movement, and the next decision your plan is making.", view: "command" },
  { icon: Sparkles, title: "Recommended Workouts", copy: "See sport-aware exercise matches with the movement and muscle rationale attached.", view: "recommended" },
  { icon: SlidersHorizontal, title: "Custom Builder", copy: "Edit sessions, prescriptions, RPE, rest, coach notes, and the full weekly map in one place.", view: "custom" },
  { icon: Activity, title: "Body Lab", copy: "Use the front-and-back anatomy board to trace a sporting action into its relevant muscle roles.", view: "body" },
  { icon: Move3d, title: "Movement Atlas", copy: "Explore all researched sport actions, then open only the biomechanics and support you need.", view: "movement" },
  { icon: Dna, title: "Exercise Genome", copy: "Learn the mechanics behind an exercise and how its strengths change with your sport and current stack.", view: "genome" },
] as const;

export function FeatureTour({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: string) => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const complete = () => { onNavigate(current.view); onClose(); };
  return <div className="feature-tour-layer" role="dialog" aria-modal="true" aria-labelledby="feature-tour-title"><section className="feature-tour-card"><button onClick={onClose} className="feature-tour-close" aria-label="Skip feature tour"><X className="h-4 w-4" /></button><div className="feature-tour-icon"><Icon className="h-6 w-6" /></div><p className="metric-label">Your Gym Optimizer guide · {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p><h2 id="feature-tour-title">{current.title}</h2><p>{current.copy}</p><div className="feature-tour-progress">{steps.map((item, index) => <span key={item.title} className={index === step ? "feature-tour-progress-active" : index < step ? "feature-tour-progress-done" : ""} />)}</div><div className="feature-tour-actions"><button onClick={onClose} className="feature-tour-skip">Skip guide</button><div className="flex gap-2">{step > 0 && <button onClick={() => setStep((value) => value - 1)} className="feature-tour-back"><ArrowLeft className="h-4 w-4" /> Back</button>}<button onClick={() => step === steps.length - 1 ? complete() : setStep((value) => value + 1)} className="feature-tour-next">{step === steps.length - 1 ? "Open workspace" : "Next"}<ArrowRight className="h-4 w-4" /></button></div></div></section></div>;
}

