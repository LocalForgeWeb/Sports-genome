import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

type LaunchExperienceProps = { onFinish: () => void; interactive?: boolean };

/** A visual-only first-entry transition. It deliberately contains no audio or media playback. */
export function LaunchExperience({ onFinish, interactive = false }: LaunchExperienceProps) {
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (interactive) skipButtonRef.current?.focus();
    const timer = window.setTimeout(onFinish, reducedMotion ? 260 : 3500);
    return () => window.clearTimeout(timer);
  }, [interactive, onFinish, reducedMotion]);

  const skip = () => {
    emitInteractionFeedback(12);
    onFinish();
  };

  return <section className={`launch-experience ${interactive ? "launch-experience-replay" : "launch-experience-underlay"} ${reducedMotion ? "launch-experience-reduced" : ""}`} role={interactive ? "dialog" : undefined} aria-modal={interactive || undefined} aria-label="Sports Genome launch screen">
    <div className="launch-experience-glow launch-experience-glow-one" />
    <div className="launch-experience-glow launch-experience-glow-two" />
    <button ref={skipButtonRef} type="button" onClick={skip} className="launch-experience-skip">Skip intro <ArrowRight className="h-3.5 w-3.5" /></button>
    <div className="launch-experience-center">
      <div className="launch-experience-mark" aria-hidden="true">
        <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="launch-strand launch-strand-left" d="M22 105C65 105 67 35 120 35C173 35 175 105 218 105" />
          <path className="launch-strand launch-strand-right" d="M22 35C65 35 67 105 120 105C173 105 175 35 218 35" />
          <path className="launch-rung launch-rung-one" d="M48 54L72 86" />
          <path className="launch-rung launch-rung-two" d="M89 42L111 70" />
          <path className="launch-rung launch-rung-three" d="M129 70L151 98" />
          <path className="launch-rung launch-rung-four" d="M169 42L193 74" />
          <circle className="launch-pulse" cx="120" cy="70" r="8" />
        </svg>
      </div>
      <img src="/manus-storage/sports-genome-icon-192_ae889a25.png" alt="Sports Genome" className="launch-experience-logo" />
      <p className="launch-experience-kicker">Sports Genome</p>
      <p className="launch-experience-wordmark">Decoding performance</p>
      <p className="launch-experience-status" aria-live="polite">Preparing your training workspace</p>
    </div>
  </section>;
}
