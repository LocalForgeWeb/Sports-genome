/**
 * THIRD-PARTY PRESENTATION CODE, kept as supplied.
 *
 * From the forearm anatomy handoff (sports-genome-forearm-anatomy-claude-handoff.zip,
 * src/anatomy/muscleManifest.ts; task SG-FOREARM-INTEGRATION-20261019). The mesh names are
 * node names in the Open3Dmodel upper-limb GLB (public/assets/anatomy). Only the import of
 * the entry type changed. The ids here are the viewer's own *source* ids: the app never uses
 * them directly, it goes through `modelIdentity.ts`, which maps each one to exactly one
 * canonical atlas id (`shared/specialization/ids.ts`).
 */
import type { MuscleId, MuscleManifestEntry } from './modelTypes';

/**
 * Adapt this manifest to Sports Genome's stable IDs without touching the GLB.
 * Names are verified node names in the Open3Dmodel upper-limb source.
 * Groups are navigational only: every entry is still independently selectable.
 */
export const muscleManifest: MuscleManifestEntry[] = [
  { id: 'brachioradialis', displayName: 'Brachioradialis', meshNames: ['Brachioradialis muscle.r'], layer: 'outer', group: 'landmark', cameraPreset: 'brachioradialis', revealPreset: 'outer' },
  { id: 'anconeus', displayName: 'Anconeus', meshNames: ['Anconeus muscle.r'], layer: 'outer', group: 'landmark', cameraPreset: 'anconeus', revealPreset: 'outer' },
  { id: 'supinator', displayName: 'Supinator', meshNames: ['Supinator.r'], layer: 'deep', group: 'landmark', cameraPreset: 'supinator', revealPreset: 'deep' },

  { id: 'flexor-digitorum-superficialis', displayName: 'Flexor digitorum superficialis', meshNames: ['Flexor digitorum superficialis humero-ulnar head.r', 'Flexor digitorum superficialis radial head.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'flexor-digitorum-superficialis', revealPreset: 'superficial' },
  { id: 'flexor-digitorum-profundus', displayName: 'Flexor digitorum profundus', meshNames: ['Flexor digitorum profundus.r'], layer: 'deep', group: 'flexors', cameraPreset: 'flexor-digitorum-profundus', revealPreset: 'deep' },
  { id: 'flexor-carpi-ulnaris', displayName: 'Flexor carpi ulnaris', meshNames: ['Humeral head of flexor carpi ulnaris.r', 'Ulnar head of flexor carpi ulnaris.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'flexor-carpi-ulnaris', revealPreset: 'superficial' },
  { id: 'flexor-carpi-radialis', displayName: 'Flexor carpi radialis', meshNames: ['Flexor carpi radialis.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'flexor-carpi-radialis', revealPreset: 'superficial' },
  { id: 'palmaris-longus', displayName: 'Palmaris longus', meshNames: ['Palmaris longus muscle.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'palmaris-longus', revealPreset: 'superficial' },
  { id: 'flexor-pollicis-longus', displayName: 'Flexor pollicis longus', meshNames: ['Flexor pollicis longus.r'], layer: 'deep', group: 'flexors', cameraPreset: 'flexor-pollicis-longus', revealPreset: 'deep' },
  { id: 'pronator-teres', displayName: 'Pronator teres', meshNames: ['Humeral head of pronator teres.r', 'Ulnar head of pronator teres.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'pronator-teres', revealPreset: 'superficial' },
  { id: 'pronator-quadratus', displayName: 'Pronator quadratus', meshNames: ['Pronator quadratus.r'], layer: 'deep', group: 'flexors', cameraPreset: 'pronator-quadratus', revealPreset: 'deep' },

  { id: 'extensor-digitorum', displayName: 'Extensor digitorum', meshNames: ['Extensor digitorum.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-digitorum', revealPreset: 'outer' },
  { id: 'extensor-carpi-radialis-brevis', displayName: 'Extensor carpi radialis brevis', meshNames: ['Extensor carpi radialis brevis.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-carpi-radialis-brevis', revealPreset: 'outer' },
  { id: 'extensor-carpi-radialis-longus', displayName: 'Extensor carpi radialis longus', meshNames: ['Extensor carpi radialis longus.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-carpi-radialis-longus', revealPreset: 'outer' },
  { id: 'extensor-carpi-ulnaris', displayName: 'Extensor carpi ulnaris', meshNames: ['Humeral head of extensor carpi ulnaris.r', 'Ulnar head of extensor carpi ulnaris.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-carpi-ulnaris', revealPreset: 'outer' },
  { id: 'extensor-digiti-minimi', displayName: 'Extensor digiti minimi', meshNames: ['Extensor digiti minimi.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-digiti-minimi', revealPreset: 'outer' },
  { id: 'extensor-indicis', displayName: 'Extensor indicis', meshNames: ['Extensor indicis.r'], layer: 'deep', group: 'extensors', cameraPreset: 'extensor-indicis', revealPreset: 'deep' },
  { id: 'extensor-pollicis-longus', displayName: 'Extensor pollicis longus', meshNames: ['Extensor pollicis longus.r'], layer: 'deep', group: 'extensors', cameraPreset: 'extensor-pollicis-longus', revealPreset: 'deep' },
  { id: 'extensor-pollicis-brevis', displayName: 'Extensor pollicis brevis', meshNames: ['Extensor pollicis brevis.r'], layer: 'deep', group: 'extensors', cameraPreset: 'extensor-pollicis-brevis', revealPreset: 'deep' },
  { id: 'abductor-pollicis-longus', displayName: 'Abductor pollicis longus', meshNames: ['Abductor pollicis longus.r'], layer: 'deep', group: 'extensors', cameraPreset: 'abductor-pollicis-longus', revealPreset: 'deep' },
];

export const manifestById = Object.fromEntries(
  muscleManifest.map((entry) => [entry.id, entry]),
) as Record<MuscleId, MuscleManifestEntry>;

export const selectableMuscleIds = muscleManifest.map((entry) => entry.id);

export const muscleLayerNames = {
  superficial: [
    'Flexor carpi radialis.r',
    'Flexor digitorum superficialis humero-ulnar head.r',
    'Flexor digitorum superficialis radial head.r',
    'Humeral head of flexor carpi ulnaris.r',
    'Ulnar head of flexor carpi ulnaris.r',
    'Palmaris longus muscle.r',
    'Humeral head of pronator teres.r',
    'Ulnar head of pronator teres.r',
  ],
  tendons: [
    'Flexor carpi radialis tendon sheath',
    'Common flexor tendon sheath',
    'Flexor pollicis longus tendon sheath',
  ],
} as const;
