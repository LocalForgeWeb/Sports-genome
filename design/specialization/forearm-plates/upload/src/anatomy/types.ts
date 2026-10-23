export type MuscleId = string;
export type Side = 'left' | 'right';
export type Mode = 'planned' | 'completed';

export interface ExerciseContribution {
  id: string;
  name: string;
  exposure: string;
}

export interface MuscleData {
  id: MuscleId;
  displayName: string;
  shortName?: string;
  physicalFunction: string;
  visibleShapeContribution: string;
  directDynamicSets: number;
  supportingExerciseExposure: number;
  deliberateIsometricBouts: number;
  isometricHoldSeconds: number;
  incidentalGripExposure: number;
  targetSets?: number;
  exercises: ExerciseContribution[];
  dataStatus?: 'complete' | 'partial' | 'uncertain' | 'missing';
  dataNote?: string;
}

export interface DateRange {
  label: string;
  start?: string;
  end?: string;
}

export interface AnatomyTheme {
  background?: string;
  accent?: string;
  panel?: string;
  mainText?: string;
  secondaryText?: string;
}

export interface ForearmAnatomyProps {
  selectedMuscleId?: MuscleId | null;
  muscleDataById: Record<MuscleId, MuscleData>;
  side: Side;
  dateRange: DateRange;
  mode: Mode;
  loading?: boolean;
  error?: string | null;
  reducedMotion?: boolean;
  theme?: AnatomyTheme;
  onMuscleSelect?: (muscleId: MuscleId) => void;
  onExerciseSelect?: (exerciseId: string) => void;
  onAddExercise?: (muscleId: MuscleId) => void;
  onViewContributions?: (muscleId: MuscleId) => void;
  onReturnToOverview?: () => void;
}

export interface MuscleManifestEntry {
  id: MuscleId;
  displayName: string;
  /** Permanent human-readable anatomy index, e.g. 1 renders as F01. */
  catalogNumber: number;
  /** Plain-language location and layer tag shown beside the anatomy index. */
  anatomyTag: string;
  meshNames: string[];
  layer: 'outer' | 'superficial' | 'deep';
  group: 'landmark' | 'flexors' | 'extensors';
  cameraPreset: string;
  revealPreset: string;
}

export type CanvasStatus = 'idle' | 'loading' | 'ready' | 'error';
