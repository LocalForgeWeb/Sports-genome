/**
 * THIRD-PARTY PRESENTATION CODE, kept as supplied.
 *
 * From the forearm anatomy handoff (src/anatomy/settings.ts; task
 * SG-FOREARM-INTEGRATION-20261019): the approved framing and reveal presets, unchanged. The
 * offsets are for the right arm the model is; the canvas mirrors their x for the left arm.
 */
import { Vector3 } from 'three';

export interface CameraPreset {
  target: Vector3;
  offset: Vector3;
  distance: number;
  durationMs: number;
}

export interface RevealPreset {
  selectedOpacity: number;
  surroundingOpacity: number;
  superficialOpacity: number;
  tendonOpacity: number;
  transitionMs: number;
}

/** Edit these presets to tune framing without changing the component contract. */
export const cameraPresets: Record<string, CameraPreset> = {
  overview: {
    target: new Vector3(0, 0, 0),
    offset: new Vector3(0.46, 0.16, 1),
    distance: 4.8,
    durationMs: 650,
  },
  brachioradialis: {
    target: new Vector3(0.13, 0.1, 0),
    offset: new Vector3(0.5, 0.12, 1),
    distance: 4.45,
    durationMs: 560,
  },
  'flexor-carpi-radialis': {
    target: new Vector3(-0.02, 0.06, 0),
    offset: new Vector3(-0.34, 0.11, 1),
    distance: 4.2,
    durationMs: 560,
  },
  'flexor-digitorum-profundus': {
    target: new Vector3(-0.02, -0.03, 0),
    offset: new Vector3(-0.34, 0.08, 1),
    distance: 4.15,
    durationMs: 680,
  },
  'flexor-digitorum-superficialis': {
    target: new Vector3(-0.02, 0.02, 0),
    offset: new Vector3(-0.26, 0.12, 1),
    distance: 4.25,
    durationMs: 580,
  },
  'flexor-carpi-ulnaris': {
    target: new Vector3(-0.08, -0.02, 0),
    offset: new Vector3(0.32, 0.1, 1),
    distance: 4.25,
    durationMs: 580,
  },
  'pronator-teres': {
    target: new Vector3(0.06, 0.18, 0),
    offset: new Vector3(0.44, 0.16, 1),
    distance: 4.35,
    durationMs: 560,
  },
  'extensor-digitorum': {
    target: new Vector3(0.02, 0.02, 0),
    offset: new Vector3(0.3, 0.1, 1),
    distance: 4.3,
    durationMs: 580,
  },
  'extensor-carpi-radialis-brevis': {
    target: new Vector3(0.08, 0.12, 0),
    offset: new Vector3(0.44, 0.13, 1),
    distance: 4.3,
    durationMs: 580,
  },
  'extensor-carpi-radialis-longus': {
    target: new Vector3(0.14, 0.2, 0),
    offset: new Vector3(0.46, 0.15, 1),
    distance: 4.35,
    durationMs: 580,
  },
  'extensor-carpi-ulnaris': {
    target: new Vector3(-0.12, -0.06, 0),
    offset: new Vector3(-0.28, 0.1, 1),
    distance: 4.25,
    durationMs: 580,
  },
  anconeus: {
    target: new Vector3(-0.1, 0.25, 0),
    offset: new Vector3(0.42, 0.2, 1),
    distance: 4.4,
    durationMs: 560,
  },
  supinator: {
    target: new Vector3(0.08, 0.16, 0),
    offset: new Vector3(0.48, 0.14, 1),
    distance: 4.28,
    durationMs: 660,
  },
  'palmaris-longus': {
    target: new Vector3(-0.02, 0.03, 0),
    offset: new Vector3(-0.24, 0.1, 1),
    distance: 4.25,
    durationMs: 580,
  },
  'flexor-pollicis-longus': {
    target: new Vector3(0.08, -0.02, 0),
    offset: new Vector3(-0.34, 0.1, 1),
    distance: 4.18,
    durationMs: 660,
  },
  'pronator-quadratus': {
    target: new Vector3(-0.03, -0.24, 0),
    offset: new Vector3(-0.28, 0.06, 1),
    distance: 4.12,
    durationMs: 680,
  },
  'extensor-digiti-minimi': {
    target: new Vector3(-0.14, -0.04, 0),
    offset: new Vector3(0.3, 0.1, 1),
    distance: 4.22,
    durationMs: 600,
  },
  'extensor-indicis': {
    target: new Vector3(0.02, -0.08, 0),
    offset: new Vector3(0.3, 0.08, 1),
    distance: 4.15,
    durationMs: 660,
  },
  'extensor-pollicis-longus': {
    target: new Vector3(0.1, -0.04, 0),
    offset: new Vector3(0.46, 0.1, 1),
    distance: 4.16,
    durationMs: 660,
  },
  'extensor-pollicis-brevis': {
    target: new Vector3(0.08, -0.08, 0),
    offset: new Vector3(0.44, 0.08, 1),
    distance: 4.14,
    durationMs: 660,
  },
  'abductor-pollicis-longus': {
    target: new Vector3(0.12, -0.02, 0),
    offset: new Vector3(0.48, 0.1, 1),
    distance: 4.18,
    durationMs: 660,
  },
};

export const revealPresets: Record<string, RevealPreset> = {
  outer: {
    selectedOpacity: 1,
    surroundingOpacity: 0.26,
    superficialOpacity: 0.34,
    tendonOpacity: 0.22,
    transitionMs: 520,
  },
  superficial: {
    selectedOpacity: 1,
    surroundingOpacity: 0.2,
    superficialOpacity: 0.26,
    tendonOpacity: 0.16,
    transitionMs: 520,
  },
  deep: {
    selectedOpacity: 1,
    surroundingOpacity: 0.1,
    superficialOpacity: 0.06,
    tendonOpacity: 0.08,
    transitionMs: 720,
  },
};
