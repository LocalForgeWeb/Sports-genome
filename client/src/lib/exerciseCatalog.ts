/** Kinetic Field Manual: app data favors transparent training logic over false precision. */

import { expandedExercises } from "./exerciseCatalogExpansion";

export type Sport = 'tennis' | 'basketball' | 'soccer' | 'baseball' | 'combat';
export type Grade = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

export interface Exercise {
  id: number;
  name: string;
  sourceGroup: string;
  category: string;
  equipment: string;
  movement: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  qualities: string[];
  muscleGrade: Grade;
  sportFit: Record<Sport, { grade: Grade; movementHelp: string }>;
}

export const sports: { id: Sport; label: string; descriptor: string }[] = [
  { id: 'tennis', label: 'Tennis', descriptor: 'rotation + court recovery' },
  { id: 'basketball', label: 'Basketball', descriptor: 'jump + court contact' },
  { id: 'soccer', label: 'Soccer', descriptor: 'sprint + cutting' },
  { id: 'baseball', label: 'Baseball', descriptor: 'rotation + deceleration' },
  { id: 'combat', label: 'Combat', descriptor: 'stance + grip' },
];

export const baseExercises: Exercise[] = [
  {
    "id": 1,
    "name": "Barbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Barbell",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 2,
    "name": "Incline Barbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Barbell",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 3,
    "name": "Decline Barbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Barbell",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 4,
    "name": "Dumbbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 5,
    "name": "Incline Dumbbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 6,
    "name": "Decline Dumbbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 7,
    "name": "Dumbbell Floor Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 8,
    "name": "Dumbbell Squeeze Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 9,
    "name": "Alternating Dumbbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 10,
    "name": "Single-Arm Dumbbell Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 11,
    "name": "Machine Chest Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Machine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 12,
    "name": "Incline Machine Chest Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Machine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 13,
    "name": "Plate-Loaded Chest Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 14,
    "name": "Smith Machine Bench Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Machine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 15,
    "name": "Smith Machine Incline Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Machine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 16,
    "name": "Cable Chest Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Cable",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 17,
    "name": "Single-Arm Cable Chest Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Cable",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 18,
    "name": "Cable Fly",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Cable",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 19,
    "name": "Low-to-High Cable Fly",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Cable",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 20,
    "name": "High-to-Low Cable Fly",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Cable",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 21,
    "name": "Pec Deck Fly",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Machine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 22,
    "name": "Dumbbell Fly",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 23,
    "name": "Incline Dumbbell Fly",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 24,
    "name": "Dumbbell Pullover",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Dumbbells",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 25,
    "name": "Plate Squeeze Press",
    "sourceGroup": "Chest — Free Weights, Machines & Cables",
    "category": "Chest & push",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "pressing force & shoulder control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact strength & passing force"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & hand-fighting"
      }
    }
  },
  {
    "id": 26,
    "name": "Standard Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 27,
    "name": "Wide-Grip Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 28,
    "name": "Diamond Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 29,
    "name": "Decline Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 30,
    "name": "Incline Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 31,
    "name": "Archer Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 32,
    "name": "Plyometric Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 33,
    "name": "Clap Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 34,
    "name": "Explosive Depth Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 35,
    "name": "Deficit Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 36,
    "name": "Ring Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 37,
    "name": "Weighted Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 38,
    "name": "Spiderman Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 39,
    "name": "Typewriter Push-Up",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 40,
    "name": "Parallel-Bar Dip",
    "sourceGroup": "Chest / Triceps Calisthenics",
    "category": "Chest & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "power",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "shoulder stability & pressing control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact tolerance & finishing"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "ground-contact pushing"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posting & frames"
      }
    }
  },
  {
    "id": 41,
    "name": "Conventional Deadlift",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 42,
    "name": "Romanian Deadlift",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 43,
    "name": "Barbell Bent-Over Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Barbell",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 44,
    "name": "Pendlay Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Barbell",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 45,
    "name": "Underhand Barbell Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Barbell",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 46,
    "name": "Dumbbell Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Dumbbells",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 47,
    "name": "Chest-Supported Dumbbell Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Dumbbells",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 48,
    "name": "Seal Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 49,
    "name": "Meadows Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 50,
    "name": "T-Bar Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 51,
    "name": "Chest-Supported T-Bar Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 52,
    "name": "Machine High Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Machine",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 53,
    "name": "Machine Low Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Machine",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 54,
    "name": "Seated Cable Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Cable",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 55,
    "name": "Wide-Grip Cable Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Cable",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 56,
    "name": "Single-Arm Cable Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Cable",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 57,
    "name": "Lat Pulldown",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 58,
    "name": "Wide-Grip Lat Pulldown",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 59,
    "name": "Neutral-Grip Lat Pulldown",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 60,
    "name": "Underhand Lat Pulldown",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 61,
    "name": "Single-Arm Lat Pulldown",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 62,
    "name": "Straight-Arm Cable Pulldown",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Cable",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 63,
    "name": "Cable Pullover",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Cable",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 64,
    "name": "Machine Pullover",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Machine",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 65,
    "name": "Dumbbell Pullover",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Dumbbells",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 66,
    "name": "Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 67,
    "name": "Chin-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 68,
    "name": "Neutral-Grip Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 69,
    "name": "Wide-Grip Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 70,
    "name": "Weighted Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 71,
    "name": "Weighted Chin-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Free weights",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 72,
    "name": "Commando Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 73,
    "name": "Archer Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 74,
    "name": "L-Sit Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 75,
    "name": "Inverted Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 76,
    "name": "Feet-Elevated Inverted Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 77,
    "name": "Ring Row",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 78,
    "name": "Towel Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 79,
    "name": "Scapular Pull-Up",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 80,
    "name": "Rope Climb",
    "sourceGroup": "Back — Lats & Upper Back",
    "category": "Back & pull",
    "equipment": "Bodyweight",
    "movement": "Vertical pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl",
      "grip"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet deceleration & posture"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebounding position & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "shielding support"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "throwing/batting deceleration"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "clinch pulling & grip"
      }
    }
  },
  {
    "id": 81,
    "name": "Barbell Shrug",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Barbell",
    "movement": "Scapular elevation",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [
      "forearms",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 82,
    "name": "Dumbbell Shrug",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Dumbbells",
    "movement": "Scapular elevation",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [
      "forearms",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 83,
    "name": "Trap-Bar Shrug",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular elevation",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [
      "forearms",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 84,
    "name": "Cable Shrug",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Cable",
    "movement": "Scapular elevation",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [
      "forearms",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 85,
    "name": "Machine Shrug",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Machine",
    "movement": "Scapular elevation",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [
      "forearms",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 86,
    "name": "Incline Dumbbell Shrug",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Dumbbells",
    "movement": "Scapular elevation",
    "primaryMuscles": [
      "traps"
    ],
    "secondaryMuscles": [
      "forearms",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 87,
    "name": "Face Pull",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 88,
    "name": "Rope Face Pull with External Rotation",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 89,
    "name": "Reverse Pec Deck",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Machine",
    "movement": "Scapular retraction & external rotation",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "upperBack",
      "rotatorCuff"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 90,
    "name": "Bent-Over Rear-Delt Fly",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 91,
    "name": "Chest-Supported Rear-Delt Raise",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 92,
    "name": "Cable Rear-Delt Fly",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Cable",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 93,
    "name": "Single-Arm Cable Rear-Delt Fly",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Cable",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 94,
    "name": "Dumbbell Y-Raise",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Dumbbells",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 95,
    "name": "Cable Y-Raise",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Cable",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 96,
    "name": "Prone Y-Raise",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 97,
    "name": "Prone T-Raise",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 98,
    "name": "Prone W-Raise",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Free weights",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 99,
    "name": "Scapular Wall Slide",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Bodyweight",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 100,
    "name": "Band Pull-Apart",
    "sourceGroup": "Rear Delts, Traps & Scapular Muscles",
    "category": "Scapular control",
    "equipment": "Band",
    "movement": "Scapular control",
    "primaryMuscles": [
      "rearDelts",
      "traps"
    ],
    "secondaryMuscles": [
      "rotatorCuff",
      "upperBack"
    ],
    "qualities": [
      "hypertrophy",
      "scapularControl",
      "posture"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "shoulder control & deceleration"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "rebound posture"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "upper-body posture"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "throwing shoulder support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "posture under contact"
      }
    }
  },
  {
    "id": 101,
    "name": "Barbell Overhead Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Barbell",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 102,
    "name": "Seated Barbell Overhead Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Barbell",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 103,
    "name": "Dumbbell Shoulder Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Dumbbells",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 104,
    "name": "Seated Dumbbell Shoulder Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Dumbbells",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 105,
    "name": "Arnold Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 106,
    "name": "Machine Shoulder Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Machine",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 107,
    "name": "Smith Machine Shoulder Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Machine",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 108,
    "name": "Single-Arm Dumbbell Overhead Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Dumbbells",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 109,
    "name": "Z-Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Free weights",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 110,
    "name": "Push Press",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 111,
    "name": "Dumbbell Lateral Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Dumbbells",
    "movement": "Shoulder abduction",
    "primaryMuscles": [
      "sideDelts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 112,
    "name": "Cable Lateral Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Cable",
    "movement": "Shoulder abduction",
    "primaryMuscles": [
      "sideDelts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 113,
    "name": "Machine Lateral Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Machine",
    "movement": "Shoulder abduction",
    "primaryMuscles": [
      "sideDelts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 114,
    "name": "Leaning Cable Lateral Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Cable",
    "movement": "Shoulder abduction",
    "primaryMuscles": [
      "sideDelts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 115,
    "name": "Behind-the-Back Cable Lateral Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Cable",
    "movement": "Shoulder abduction",
    "primaryMuscles": [
      "sideDelts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 116,
    "name": "Incline Dumbbell Lateral Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Dumbbells",
    "movement": "Shoulder abduction",
    "primaryMuscles": [
      "sideDelts"
    ],
    "secondaryMuscles": [
      "traps"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 117,
    "name": "Dumbbell Front Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Dumbbells",
    "movement": "Shoulder flexion",
    "primaryMuscles": [
      "frontDelts"
    ],
    "secondaryMuscles": [
      "chest"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 118,
    "name": "Cable Front Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Cable",
    "movement": "Shoulder flexion",
    "primaryMuscles": [
      "frontDelts"
    ],
    "secondaryMuscles": [
      "chest"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 119,
    "name": "Plate Front Raise",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Free weights",
    "movement": "Shoulder flexion",
    "primaryMuscles": [
      "frontDelts"
    ],
    "secondaryMuscles": [
      "chest"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 120,
    "name": "Handstand Push-Up",
    "sourceGroup": "Shoulders",
    "category": "Shoulders",
    "equipment": "Bodyweight",
    "movement": "Vertical push",
    "primaryMuscles": [
      "frontDelts",
      "sideDelts"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "scapularControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "overhead control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "overhead reach & contact"
      },
      "soccer": {
        "grade": "C",
        "movementHelp": "contact tolerance"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body strength"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & striking support"
      }
    }
  },
  {
    "id": 121,
    "name": "Barbell Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Barbell",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 122,
    "name": "EZ-Bar Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 123,
    "name": "Dumbbell Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Dumbbells",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 124,
    "name": "Alternating Dumbbell Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Dumbbells",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 125,
    "name": "Incline Dumbbell Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Dumbbells",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 126,
    "name": "Preacher Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 127,
    "name": "Machine Preacher Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Machine",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 128,
    "name": "Cable Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Cable",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 129,
    "name": "Bayesian Cable Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Cable",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 130,
    "name": "Spider Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 131,
    "name": "Concentration Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 132,
    "name": "Hammer Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 133,
    "name": "Cross-Body Hammer Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 134,
    "name": "Rope Hammer Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 135,
    "name": "Reverse Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 136,
    "name": "Zottman Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 137,
    "name": "Drag Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 138,
    "name": "Chin-Up Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Elbow flexion",
    "primaryMuscles": [
      "biceps",
      "brachialis"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 139,
    "name": "Wrist Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 140,
    "name": "Reverse Wrist Curl",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 141,
    "name": "Wrist Roller",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 142,
    "name": "Plate Pinch",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 143,
    "name": "Dead Hang",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Bodyweight",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 144,
    "name": "Towel Dead Hang",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Bodyweight",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 145,
    "name": "Farmer Hold",
    "sourceGroup": "Biceps, Brachialis & Forearms",
    "category": "Arms & grip",
    "equipment": "Free weights",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "hypertrophy",
      "grip",
      "endurance"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "racquet grip endurance"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "ball protection"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact robustness"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "bat/ball control"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "grip endurance"
      }
    }
  },
  {
    "id": 146,
    "name": "Close-Grip Bench Press",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 147,
    "name": "JM Press",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 148,
    "name": "Skull Crusher",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Barbell",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 149,
    "name": "Dumbbell Skull Crusher",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Dumbbells",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 150,
    "name": "Cable Triceps Pushdown",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Cable",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 151,
    "name": "Rope Triceps Pushdown",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Free weights",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 152,
    "name": "Reverse-Grip Pushdown",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Free weights",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 153,
    "name": "Single-Arm Cable Pushdown",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Cable",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 154,
    "name": "Overhead Cable Triceps Extension",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Cable",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 155,
    "name": "Dumbbell Overhead Triceps Extension",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Dumbbells",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 156,
    "name": "Single-Arm Dumbbell Triceps Extension",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Dumbbells",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 157,
    "name": "Machine Triceps Extension",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Machine",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 158,
    "name": "Bench Dip",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 159,
    "name": "Ring Dip",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Bodyweight",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 160,
    "name": "Bodyweight Triceps Extension",
    "sourceGroup": "Triceps",
    "category": "Arms & push",
    "equipment": "Free weights",
    "movement": "Elbow extension",
    "primaryMuscles": [
      "triceps"
    ],
    "secondaryMuscles": [
      "frontDelts"
    ],
    "qualities": [
      "hypertrophy",
      "strength"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "racquet-side press support"
      },
      "basketball": {
        "grade": "B",
        "movementHelp": "passing & finishing support"
      },
      "soccer": {
        "grade": "D",
        "movementHelp": "contact support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "upper-body force transfer"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "frames & punching support"
      }
    }
  },
  {
    "id": 161,
    "name": "Back Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 162,
    "name": "High-Bar Back Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 163,
    "name": "Front Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 164,
    "name": "Zercher Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Barbell",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 165,
    "name": "Goblet Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 166,
    "name": "Hack Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 167,
    "name": "Pendulum Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 168,
    "name": "Smith Machine Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Machine",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 169,
    "name": "Leg Press",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Machine",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 170,
    "name": "Single-Leg Leg Press",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Machine",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 171,
    "name": "Leg Extension",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 172,
    "name": "Single-Leg Leg Extension",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 173,
    "name": "Bulgarian Split Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 174,
    "name": "Front-Foot-Elevated Split Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 175,
    "name": "Reverse Lunge",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 176,
    "name": "Forward Lunge",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 177,
    "name": "Walking Lunge",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 178,
    "name": "Deficit Reverse Lunge",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 179,
    "name": "Step-Up",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 180,
    "name": "Peterson Step-Up",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 181,
    "name": "Cyclist Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 182,
    "name": "Sissy Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 183,
    "name": "Spanish Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Free weights",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 184,
    "name": "Pistol Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Bodyweight",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 185,
    "name": "Assisted Pistol Squat",
    "sourceGroup": "Quads",
    "category": "Knee dominant",
    "equipment": "Bodyweight",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & lateral push-off"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jumping & cutting"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & cutting"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-force production"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & level changes"
      }
    }
  },
  {
    "id": 186,
    "name": "Romanian Deadlift",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 187,
    "name": "Stiff-Leg Deadlift",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 188,
    "name": "Single-Leg Romanian Deadlift",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 189,
    "name": "Dumbbell Romanian Deadlift",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Dumbbells",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 190,
    "name": "Good Morning",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Barbell",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 191,
    "name": "Seated Good Morning",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Barbell",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 192,
    "name": "Nordic Hamstring Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 193,
    "name": "Assisted Nordic Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 194,
    "name": "Lying Leg Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 195,
    "name": "Seated Leg Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 196,
    "name": "Standing Single-Leg Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 197,
    "name": "Stability-Ball Hamstring Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 198,
    "name": "Slider Hamstring Curl",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 199,
    "name": "Glute-Ham Raise",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Knee flexion",
    "primaryMuscles": [
      "hamstrings"
    ],
    "secondaryMuscles": [
      "calves",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 200,
    "name": "45-Degree Back Extension",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 201,
    "name": "Reverse Hyperextension",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 202,
    "name": "Cable Pull-Through",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Cable",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 203,
    "name": "Kettlebell Swing",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Kettlebell",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 204,
    "name": "Barbell Hip Hinge",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Barbell",
    "movement": "Hip hinge or knee flexion",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 205,
    "name": "B-Stance Romanian Deadlift",
    "sourceGroup": "Hamstrings & Posterior Chain",
    "category": "Posterior chain",
    "equipment": "Free weights",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "eccentric",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "braking & re-acceleration"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "takeoff & landing support"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint support & braking"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "ground-up force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "hip drive & sprawls"
      }
    }
  },
  {
    "id": 206,
    "name": "Barbell Hip Thrust",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Barbell",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 207,
    "name": "Smith Machine Hip Thrust",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Machine",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 208,
    "name": "Dumbbell Hip Thrust",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Dumbbells",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 209,
    "name": "Single-Leg Hip Thrust",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Free weights",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 210,
    "name": "Glute Bridge",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Free weights",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 211,
    "name": "Single-Leg Glute Bridge",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Free weights",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 212,
    "name": "Cable Glute Kickback",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Cable",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 213,
    "name": "Machine Glute Kickback",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Machine",
    "movement": "Hip extension",
    "primaryMuscles": [
      "glutes"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 214,
    "name": "Hip Abduction Machine",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Machine",
    "movement": "Lateral hip control",
    "primaryMuscles": [
      "abductors",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "quads"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 215,
    "name": "Cable Hip Abduction",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Cable",
    "movement": "Lateral hip control",
    "primaryMuscles": [
      "abductors",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "quads"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 216,
    "name": "Lateral Band Walk",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Band",
    "movement": "Lateral hip control",
    "primaryMuscles": [
      "abductors",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "quads"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 217,
    "name": "Copenhagen Plank",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 218,
    "name": "Cable Hip Adduction",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Cable",
    "movement": "Hip adduction",
    "primaryMuscles": [
      "adductors"
    ],
    "secondaryMuscles": [
      "obliques",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 219,
    "name": "Hip Adduction Machine",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Machine",
    "movement": "Hip adduction",
    "primaryMuscles": [
      "adductors"
    ],
    "secondaryMuscles": [
      "obliques",
      "glutes"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 220,
    "name": "Cossack Squat",
    "sourceGroup": "Glutes & Hip Musculature",
    "category": "Hips & glutes",
    "equipment": "Free weights",
    "movement": "Lateral hip control",
    "primaryMuscles": [
      "abductors",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "quads"
    ],
    "qualities": [
      "strength",
      "hypertrophy",
      "unilateral",
      "lateralControl"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "open-stance loading & pelvic control"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jump force & landing control"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/cutting pelvis control"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "force transfer through the hips"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance stability & bridging"
      }
    }
  },
  {
    "id": 221,
    "name": "Standing Calf Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Ankle plantarflexion",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 222,
    "name": "Seated Calf Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Ankle plantarflexion",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 223,
    "name": "Leg-Press Calf Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 224,
    "name": "Single-Leg Calf Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Ankle plantarflexion",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 225,
    "name": "Donkey Calf Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Ankle plantarflexion",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 226,
    "name": "Smith Machine Calf Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Machine",
    "movement": "Ankle plantarflexion",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 227,
    "name": "Tibialis Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Ankle dorsiflexion",
    "primaryMuscles": [
      "tibialis"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 228,
    "name": "Weighted Tibialis Raise",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Free weights",
    "movement": "Ankle dorsiflexion",
    "primaryMuscles": [
      "tibialis"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 229,
    "name": "Toe Walk",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Bodyweight",
    "movement": "Ankle plantarflexion",
    "primaryMuscles": [
      "calves"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 230,
    "name": "Heel Walk",
    "sourceGroup": "Calves, Tibialis & Lower Leg",
    "category": "Lower leg",
    "equipment": "Bodyweight",
    "movement": "Ankle dorsiflexion",
    "primaryMuscles": [
      "tibialis"
    ],
    "secondaryMuscles": [
      "feet"
    ],
    "qualities": [
      "hypertrophy",
      "elasticity",
      "locomotion"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "split-step and recovery support"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "jump & landing stiffness"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "sprint and running support"
      },
      "baseball": {
        "grade": "C",
        "movementHelp": "base-running support"
      },
      "combat": {
        "grade": "B",
        "movementHelp": "footwork support"
      }
    }
  },
  {
    "id": 231,
    "name": "Hanging Leg Raise",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 232,
    "name": "Hanging Knee Raise",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Grip isometric",
    "primaryMuscles": [
      "forearms"
    ],
    "secondaryMuscles": [
      "forearms"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 233,
    "name": "Captain’s-Chair Leg Raise",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Machine",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 234,
    "name": "Toes-to-Bar",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion, rotation or anti-rotation",
    "primaryMuscles": [
      "abs",
      "obliques"
    ],
    "secondaryMuscles": [
      "hipFlexors",
      "lowerBack"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 235,
    "name": "L-Sit",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 236,
    "name": "V-Up",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 237,
    "name": "Ab-Wheel Rollout",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 238,
    "name": "Barbell Rollout",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Barbell",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 239,
    "name": "Cable Crunch",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Cable",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 240,
    "name": "Machine Crunch",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Machine",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 241,
    "name": "Decline Sit-Up",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 242,
    "name": "Weighted Decline Sit-Up",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 243,
    "name": "Reverse Crunch",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 244,
    "name": "Dead Bug",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 245,
    "name": "Hollow-Body Hold",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 246,
    "name": "RKC Plank",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 247,
    "name": "Side Plank",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 248,
    "name": "Weighted Plank",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Bodyweight",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 249,
    "name": "Pallof Press",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Free weights",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 250,
    "name": "Cable Wood Chop",
    "sourceGroup": "Abs & Core",
    "category": "Core",
    "equipment": "Cable",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "bracing",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "stroke force transfer & bracing"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & contact bracing"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "cutting/kicking bracing"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing/throw force transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "striking and grappling bracing"
      }
    }
  },
  {
    "id": 251,
    "name": "Landmine Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 252,
    "name": "Half-Kneeling Landmine Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 253,
    "name": "Single-Arm Standing Landmine Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 254,
    "name": "Landmine Push Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 255,
    "name": "Landmine Squat-to-Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 256,
    "name": "Landmine Row",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 257,
    "name": "Meadows Landmine Row",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 258,
    "name": "Landmine T-Bar Row",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 259,
    "name": "Landmine Squat",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 260,
    "name": "Landmine Hack Squat",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Squat / knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 261,
    "name": "Landmine Reverse Lunge",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 262,
    "name": "Landmine Lateral Lunge",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Unilateral knee dominant",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "adductors",
      "calves",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 263,
    "name": "Landmine Romanian Deadlift",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 264,
    "name": "Landmine Single-Leg Romanian Deadlift",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Hip hinge",
    "primaryMuscles": [
      "hamstrings",
      "glutes"
    ],
    "secondaryMuscles": [
      "lowerBack",
      "upperBack",
      "forearms",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 265,
    "name": "Landmine Rotation",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 266,
    "name": "Landmine 180",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "S",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 267,
    "name": "Landmine Anti-Rotation Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 268,
    "name": "Landmine Thruster",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Diagonal press, pull, squat or rotation",
    "primaryMuscles": [
      "shoulders",
      "chest",
      "glutes"
    ],
    "secondaryMuscles": [
      "triceps",
      "upperBack",
      "obliques",
      "quads"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 269,
    "name": "Landmine Clean and Press",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 270,
    "name": "Landmine Split Jerk",
    "sourceGroup": "Landmine Exercises",
    "category": "Landmine",
    "equipment": "Landmine",
    "movement": "Diagonal press, pull, squat or rotation",
    "primaryMuscles": [
      "shoulders",
      "chest",
      "glutes"
    ],
    "secondaryMuscles": [
      "triceps",
      "upperBack",
      "obliques",
      "quads"
    ],
    "qualities": [
      "strength",
      "rotation",
      "antiRotation",
      "unilateral",
      "power"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "diagonal force transfer"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "unilateral control & power"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "contact and bracing"
      },
      "baseball": {
        "grade": "A",
        "movementHelp": "hip-to-shoulder transfer"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "stance drive & rotation"
      }
    }
  },
  {
    "id": 271,
    "name": "Medicine-Ball Chest Pass",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Throw, slam or ballistic rotation",
    "primaryMuscles": [
      "obliques",
      "chest",
      "shoulders"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "triceps",
      "abs"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 272,
    "name": "Explosive Medicine-Ball Push-Up",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Horizontal push",
    "primaryMuscles": [
      "chest"
    ],
    "secondaryMuscles": [
      "triceps",
      "frontDelts",
      "abs"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 273,
    "name": "Medicine-Ball Overhead Slam",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Throw, slam or ballistic rotation",
    "primaryMuscles": [
      "obliques",
      "chest",
      "shoulders"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "triceps",
      "abs"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 274,
    "name": "Medicine-Ball Rotational Slam",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 275,
    "name": "Medicine-Ball Side Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 276,
    "name": "Medicine-Ball Rotational Wall Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 277,
    "name": "Medicine-Ball Scoop Toss",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 278,
    "name": "Medicine-Ball Shot-Put Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 279,
    "name": "Medicine-Ball Overhead Backward Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 280,
    "name": "Medicine-Ball Forward Overhead Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Horizontal pull",
    "primaryMuscles": [
      "lats",
      "upperBack"
    ],
    "secondaryMuscles": [
      "biceps",
      "rearDelts",
      "forearms"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 281,
    "name": "Kneeling Medicine-Ball Chest Pass",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Throw, slam or ballistic rotation",
    "primaryMuscles": [
      "obliques",
      "chest",
      "shoulders"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "triceps",
      "abs"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 282,
    "name": "Half-Kneeling Rotational Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Free weights",
    "movement": "Rotation",
    "primaryMuscles": [
      "obliques",
      "glutes"
    ],
    "secondaryMuscles": [
      "abs",
      "shoulders",
      "chest"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 283,
    "name": "Medicine-Ball Sit-Up Throw",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Trunk flexion / anti-extension",
    "primaryMuscles": [
      "abs"
    ],
    "secondaryMuscles": [
      "obliques",
      "hipFlexors"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "A",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 284,
    "name": "Medicine-Ball Sprawl-to-Slam",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Throw, slam or ballistic rotation",
    "primaryMuscles": [
      "obliques",
      "chest",
      "shoulders"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "triceps",
      "abs"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 285,
    "name": "Medicine-Ball Slam-to-Sprint",
    "sourceGroup": "Medicine-Ball Power & Rotation",
    "category": "Medicine ball",
    "equipment": "Medicine ball",
    "movement": "Throw, slam or ballistic rotation",
    "primaryMuscles": [
      "obliques",
      "chest",
      "shoulders"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "triceps",
      "abs"
    ],
    "qualities": [
      "power",
      "rotation",
      "throwing",
      "bracing"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "SS",
        "movementHelp": "rotational shot power"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "passing & explosive extension"
      },
      "soccer": {
        "grade": "B",
        "movementHelp": "throw/brace support"
      },
      "baseball": {
        "grade": "SS",
        "movementHelp": "swing and throw sequencing"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "striking & explosive rotation"
      }
    }
  },
  {
    "id": 286,
    "name": "Box Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 287,
    "name": "Depth Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 288,
    "name": "Broad Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 289,
    "name": "Weighted Box Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 290,
    "name": "Lateral Bound",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 291,
    "name": "Single-Leg Broad Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "SS",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 292,
    "name": "Pogo Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 293,
    "name": "Jump Squat",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 294,
    "name": "Split-Squat Jump",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "A",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 295,
    "name": "Explosive Step-Up",
    "sourceGroup": "Explosive, Plyometric & Athletic",
    "category": "Plyometric",
    "equipment": "Free weights",
    "movement": "Jump / plyometric",
    "primaryMuscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "secondaryMuscles": [
      "hamstrings",
      "abs"
    ],
    "qualities": [
      "power",
      "jumping",
      "elasticity",
      "deceleration"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "S",
        "movementHelp": "split-step & lateral push-off"
      },
      "basketball": {
        "grade": "SS",
        "movementHelp": "jumping and rapid takeoff"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "sprint/jump support"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "athletic acceleration"
      },
      "combat": {
        "grade": "A",
        "movementHelp": "explosive level changes"
      }
    }
  },
  {
    "id": 296,
    "name": "Heavy Sled Push",
    "sourceGroup": "Sleds, Carries & Full-Body Conditioning",
    "category": "Conditioning",
    "equipment": "Sled",
    "movement": "Resisted locomotion / push",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "calves",
      "abs",
      "shoulders"
    ],
    "qualities": [
      "conditioning",
      "locomotion",
      "grip",
      "bracing",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "court movement capacity"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact & court capacity"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & repeated effort"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "general athletic capacity"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "drives, carries & grip"
      }
    }
  },
  {
    "id": 297,
    "name": "Backward Sled Drag",
    "sourceGroup": "Sleds, Carries & Full-Body Conditioning",
    "category": "Conditioning",
    "equipment": "Sled",
    "movement": "Resisted locomotion / drag",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "calves",
      "abs",
      "shoulders"
    ],
    "qualities": [
      "conditioning",
      "locomotion",
      "grip",
      "bracing",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "court movement capacity"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact & court capacity"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & repeated effort"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "general athletic capacity"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "drives, carries & grip"
      }
    }
  },
  {
    "id": 298,
    "name": "Sled Sprint",
    "sourceGroup": "Sleds, Carries & Full-Body Conditioning",
    "category": "Conditioning",
    "equipment": "Sled",
    "movement": "Resisted locomotion / push",
    "primaryMuscles": [
      "quads",
      "glutes"
    ],
    "secondaryMuscles": [
      "calves",
      "abs",
      "shoulders"
    ],
    "qualities": [
      "conditioning",
      "locomotion",
      "grip",
      "bracing",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "court movement capacity"
      },
      "basketball": {
        "grade": "S",
        "movementHelp": "contact & court capacity"
      },
      "soccer": {
        "grade": "S",
        "movementHelp": "acceleration & repeated effort"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "general athletic capacity"
      },
      "combat": {
        "grade": "S",
        "movementHelp": "drives, carries & grip"
      }
    }
  },
  {
    "id": 299,
    "name": "Farmer’s Walk",
    "sourceGroup": "Sleds, Carries & Full-Body Conditioning",
    "category": "Conditioning",
    "equipment": "Free weights",
    "movement": "Loaded carry",
    "primaryMuscles": [
      "forearms",
      "upperBack",
      "abs"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "calves"
    ],
    "qualities": [
      "conditioning",
      "locomotion",
      "grip",
      "bracing",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "court movement capacity"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact & court capacity"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & repeated effort"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "general athletic capacity"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "drives, carries & grip"
      }
    }
  },
  {
    "id": 300,
    "name": "Zercher Carry",
    "sourceGroup": "Sleds, Carries & Full-Body Conditioning",
    "category": "Conditioning",
    "equipment": "Barbell",
    "movement": "Loaded carry",
    "primaryMuscles": [
      "forearms",
      "upperBack",
      "abs"
    ],
    "secondaryMuscles": [
      "glutes",
      "quads",
      "calves"
    ],
    "qualities": [
      "conditioning",
      "locomotion",
      "grip",
      "bracing",
      "sprintSupport"
    ],
    "muscleGrade": "S",
    "sportFit": {
      "tennis": {
        "grade": "B",
        "movementHelp": "court movement capacity"
      },
      "basketball": {
        "grade": "A",
        "movementHelp": "contact & court capacity"
      },
      "soccer": {
        "grade": "A",
        "movementHelp": "acceleration & repeated effort"
      },
      "baseball": {
        "grade": "B",
        "movementHelp": "general athletic capacity"
      },
      "combat": {
        "grade": "SS",
        "movementHelp": "drives, carries & grip"
      }
    }
  }
] as const;

export const exercises: Exercise[] = [...baseExercises, ...expandedExercises];

export const gradeValue: Record<Grade, number> = { F: 1, D: 2, C: 3, B: 4, A: 5, S: 6, SS: 7 };
