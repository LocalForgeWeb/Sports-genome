import type { MuscleId, MuscleManifestEntry } from './types';

/**
 * Adapt this manifest to Sports Genome's stable IDs without changing the
 * offline mask-generation source. Names are verified mesh names in the
 * separated upper-limb anatomy model.
 * Groups are navigational only: every entry is still independently selectable.
 */
export const muscleManifest: MuscleManifestEntry[] = [
  { id: 'brachioradialis', displayName: 'Brachioradialis', catalogNumber: 1, anatomyTag: 'lateral forearm · outer', meshNames: ['Brachioradialis muscle.r'], layer: 'outer', group: 'landmark', cameraPreset: 'brachioradialis', revealPreset: 'outer' },
  { id: 'anconeus', displayName: 'Anconeus', catalogNumber: 2, anatomyTag: 'posterolateral elbow · outer', meshNames: ['Anconeus muscle.r'], layer: 'outer', group: 'landmark', cameraPreset: 'anconeus', revealPreset: 'outer' },
  { id: 'supinator', displayName: 'Supinator', catalogNumber: 3, anatomyTag: 'proximal dorsal forearm · deep', meshNames: ['Supinator.r'], layer: 'deep', group: 'landmark', cameraPreset: 'supinator', revealPreset: 'deep' },

  { id: 'flexor-digitorum-superficialis', displayName: 'Flexor digitorum superficialis', catalogNumber: 4, anatomyTag: 'anterior central · superficial', meshNames: ['Flexor digitorum superficialis humero-ulnar head.r', 'Flexor digitorum superficialis radial head.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'flexor-digitorum-superficialis', revealPreset: 'superficial' },
  { id: 'flexor-digitorum-profundus', displayName: 'Flexor digitorum profundus', catalogNumber: 5, anatomyTag: 'anterior ulnar · deep', meshNames: ['Flexor digitorum profundus.r'], layer: 'deep', group: 'flexors', cameraPreset: 'flexor-digitorum-profundus', revealPreset: 'deep' },
  { id: 'flexor-carpi-ulnaris', displayName: 'Flexor carpi ulnaris', catalogNumber: 6, anatomyTag: 'anterior ulnar · superficial', meshNames: ['Humeral head of flexor carpi ulnaris.r', 'Ulnar head of flexor carpi ulnaris.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'flexor-carpi-ulnaris', revealPreset: 'superficial' },
  { id: 'flexor-carpi-radialis', displayName: 'Flexor carpi radialis', catalogNumber: 7, anatomyTag: 'anterior radial · superficial', meshNames: ['Flexor carpi radialis.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'flexor-carpi-radialis', revealPreset: 'superficial' },
  { id: 'palmaris-longus', displayName: 'Palmaris longus', catalogNumber: 8, anatomyTag: 'anterior midline · superficial', meshNames: ['Palmaris longus muscle.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'palmaris-longus', revealPreset: 'superficial' },
  { id: 'flexor-pollicis-longus', displayName: 'Flexor pollicis longus', catalogNumber: 9, anatomyTag: 'anterior radial · deep', meshNames: ['Flexor pollicis longus.r'], layer: 'deep', group: 'flexors', cameraPreset: 'flexor-pollicis-longus', revealPreset: 'deep' },
  { id: 'pronator-teres', displayName: 'Pronator teres', catalogNumber: 10, anatomyTag: 'proximal anterior · superficial', meshNames: ['Humeral head of pronator teres.r', 'Ulnar head of pronator teres.r'], layer: 'superficial', group: 'flexors', cameraPreset: 'pronator-teres', revealPreset: 'superficial' },
  { id: 'pronator-quadratus', displayName: 'Pronator quadratus', catalogNumber: 11, anatomyTag: 'distal anterior · deep', meshNames: ['Pronator quadratus.r'], layer: 'deep', group: 'flexors', cameraPreset: 'pronator-quadratus', revealPreset: 'deep' },

  { id: 'extensor-digitorum', displayName: 'Extensor digitorum', catalogNumber: 12, anatomyTag: 'dorsal central · outer', meshNames: ['Extensor digitorum.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-digitorum', revealPreset: 'outer' },
  { id: 'extensor-carpi-radialis-brevis', displayName: 'Extensor carpi radialis brevis', catalogNumber: 13, anatomyTag: 'dorsal radial · outer', meshNames: ['Extensor carpi radialis brevis.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-carpi-radialis-brevis', revealPreset: 'outer' },
  { id: 'extensor-carpi-radialis-longus', displayName: 'Extensor carpi radialis longus', catalogNumber: 14, anatomyTag: 'dorsal radial · outer', meshNames: ['Extensor carpi radialis longus.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-carpi-radialis-longus', revealPreset: 'outer' },
  { id: 'extensor-carpi-ulnaris', displayName: 'Extensor carpi ulnaris', catalogNumber: 15, anatomyTag: 'dorsal ulnar · outer', meshNames: ['Humeral head of extensor carpi ulnaris.r', 'Ulnar head of extensor carpi ulnaris.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-carpi-ulnaris', revealPreset: 'outer' },
  { id: 'extensor-digiti-minimi', displayName: 'Extensor digiti minimi', catalogNumber: 16, anatomyTag: 'dorsal ulnar · outer', meshNames: ['Extensor digiti minimi.r'], layer: 'outer', group: 'extensors', cameraPreset: 'extensor-digiti-minimi', revealPreset: 'outer' },
  { id: 'extensor-indicis', displayName: 'Extensor indicis', catalogNumber: 17, anatomyTag: 'distal dorsal · deep', meshNames: ['Extensor indicis.r'], layer: 'deep', group: 'extensors', cameraPreset: 'extensor-indicis', revealPreset: 'deep' },
  { id: 'extensor-pollicis-longus', displayName: 'Extensor pollicis longus', catalogNumber: 18, anatomyTag: 'dorsal thumb · deep', meshNames: ['Extensor pollicis longus.r'], layer: 'deep', group: 'extensors', cameraPreset: 'extensor-pollicis-longus', revealPreset: 'deep' },
  { id: 'extensor-pollicis-brevis', displayName: 'Extensor pollicis brevis', catalogNumber: 19, anatomyTag: 'dorsal thumb · deep', meshNames: ['Extensor pollicis brevis.r'], layer: 'deep', group: 'extensors', cameraPreset: 'extensor-pollicis-brevis', revealPreset: 'deep' },
  { id: 'abductor-pollicis-longus', displayName: 'Abductor pollicis longus', catalogNumber: 20, anatomyTag: 'dorsal thumb · deep', meshNames: ['Abductor pollicis longus.r'], layer: 'deep', group: 'extensors', cameraPreset: 'abductor-pollicis-longus', revealPreset: 'deep' },
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
