import { lazy, Suspense, useEffect, useState } from "react";
import { UTILITY_OPEN_EVENT, type UtilityRequest } from "@/lib/utilityTools";

/**
 * Where the utility tools open: one sheet at a time, on request from any screen (lib/utilityTools).
 * Each tool's code loads only when it is first opened, so none of it weighs on the first paint.
 */
const PlateLoaderSheet = lazy(() => import("@/components/PlateLoaderSheet").then((module) => ({ default: module.PlateLoaderSheet })));
const MySetupSheet = lazy(() => import("@/components/MySetupSheet").then((module) => ({ default: module.MySetupSheet })));
const TrainingTermsSheet = lazy(() => import("@/components/TrainingTermsSheet").then((module) => ({ default: module.TrainingTermsSheet })));
const PreparationRoutinesSheet = lazy(() => import("@/components/PreparationRoutinesSheet").then((module) => ({ default: module.PreparationRoutinesSheet })));

export function UtilityToolsHost() {
  const [request, setRequest] = useState<UtilityRequest | null>(null);
  useEffect(() => {
    const open = (event: Event) => setRequest((event as CustomEvent<UtilityRequest>).detail ?? null);
    window.addEventListener(UTILITY_OPEN_EVENT, open);
    return () => window.removeEventListener(UTILITY_OPEN_EVENT, open);
  }, []);
  if (!request) return null;
  const close = () => setRequest(null);
  return <Suspense fallback={null}>
    {request.tool === "plates" && <PlateLoaderSheet key={`${request.exerciseName ?? ""}-${request.target ?? ""}`} onClose={close} exerciseName={request.exerciseName} initialTarget={request.target} initialUnit={request.unit} />}
    {request.tool === "setup" && <MySetupSheet key={request.catalogExerciseId} catalogExerciseId={request.catalogExerciseId} exerciseName={request.exerciseName} onClose={close} />}
    {request.tool === "preparation" && <PreparationRoutinesSheet key={`${request.dayLabel}-${request.mode}`} dayLabel={request.dayLabel} mode={request.mode} suggestedDrillIds={request.suggestedDrillIds} onClose={close} />}
    {request.tool === "glossary" && <TrainingTermsSheet key={request.termId ?? "all"} termId={request.termId} onClose={close} />}
  </Suspense>;
}
