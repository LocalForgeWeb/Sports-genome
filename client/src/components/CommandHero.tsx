import React from "react";
import { ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { homeHeroMode } from "@/lib/homeHeroMode";

/**
 * Home's identity band, at one of two densities.
 *
 * `introduce` is the original full-bleed introduction: photograph, display
 * headline, positioning copy. It earns its space exactly once - the first time
 * someone opens the app with nothing on their record.
 *
 * `compact` keeps the same facts (sport, plan, session fit) in a single strip, so
 * a returning athlete reaches their state, priority and next action without
 * scrolling past the pitch. Nothing is hidden that the full version showed; only
 * the introduction goes.
 */
export function CommandHero({ heroImage, sportLabel, sportAbbrev, trainingDays, topGrade, planStatus, planStatusDetail, stagedExerciseCount, onOpenRecommendations, gradeStamp }: {
  heroImage: string;
  sportLabel: string;
  sportAbbrev: string;
  trainingDays: number;
  topGrade: string;
  planStatus: string;
  planStatusDetail: string;
  stagedExerciseCount: number;
  onOpenRecommendations: () => void;
  gradeStamp: React.ReactNode;
}) {
  const sessions = trpc.workoutLog.list.useQuery();
  const overview = trpc.strengthGenome.overview.useQuery();

  const mode = homeHeroMode({
    sessionCount: (sessions.data || []).length,
    observationCount: overview.data?.observationCount || 0,
    stagedExerciseCount,
  });

  if (mode === "compact") {
    return <div className="command-identity">
      <div className="command-identity-main">
        <p className="metric-label">Your setup</p>
        <h1>{sportLabel}</h1>
        <p className="command-identity-plan">{planStatus} · {planStatusDetail}</p>
      </div>
      <dl className="command-identity-facts">
        <div><dt>Training days</dt><dd>{trainingDays}/wk</dd></div>
        <div><dt>Top session fit</dt><dd>{gradeStamp}</dd></div>
      </dl>
    </div>;
  }

  return <div className="command-hero">
    <img src={heroImage} alt="Athlete training in a performance laboratory" className="command-hero-image" />
    <div className="command-overlay" />
    <div className="relative z-10 max-w-3xl p-6 md:p-8">
      <p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Welcome to Sports Genome</p>
      <h1 className="mt-4 max-w-2xl font-display text-5xl font-bold uppercase leading-[.82] tracking-[-.02em] text-white sm:text-6xl">
        Train the action.<br /><em className="text-[var(--sg-info)]">Not just the muscle.</em>
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-6 text-[#c5d1c9]">
        Your sport is mapped through body actions, muscle roles, and exercise transfer. Every recommendation shows its reasoning.
      </p>
      <div className="mt-7 grid max-w-xl grid-cols-[1.25fr_.85fr_.9fr] divide-x divide-white/15 border-y border-white/15">
        <div className="min-w-0 py-3 pr-3">
          <p className="metric-label !text-[#819188]">Sport profile</p>
          <p className="mt-1 break-words font-display text-sm font-bold uppercase leading-tight tracking-tight text-white sm:text-xl sm:tracking-normal">{sportAbbrev}</p>
        </div>
        <div className="min-w-0 px-3 py-3">
          <p className="metric-label !text-[#819188]">Training days</p>
          <p className="mt-1 break-words font-display text-sm font-bold uppercase leading-tight tracking-tight text-white sm:text-xl sm:tracking-normal">{trainingDays}/wk</p>
        </div>
        <div className="min-w-0 px-3 py-3">
          <p className="metric-label !text-[#819188]">Top session fit</p>
          <div className="mt-1">{gradeStamp}</div>
        </div>
      </div>
    </div>
    <div className="command-signal-card">
      <p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Active plan</p>
      <p className="mt-2 font-display text-2xl font-bold uppercase leading-none text-white">{planStatus}</p>
      <p className="mt-3 text-xs leading-5 text-[#b6c3bc]">{planStatusDetail}</p>
      <button onClick={onOpenRecommendations} className="mt-5 inline-flex min-h-[2.75rem] items-center gap-2 text-[11px] font-bold uppercase tracking-[.13em] text-[var(--sg-info)]">
        Open recommendations <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  </div>;
}
