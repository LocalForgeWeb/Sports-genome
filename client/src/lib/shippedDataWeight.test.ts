import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { enrichedSportMovements, type EnrichedSportMovement } from "./enrichedSportMovementDatabase";

const databaseSource = readFileSync(join(process.cwd(), "client/src/lib/enrichedSportMovementDatabase.ts"), "utf8");

/**
 * The movement database ships to every device in its own chunk. It carried three
 * fields on all 400 records that no component ever read:
 *
 *   sourceSummary      130 KB, and only 20 distinct values across 400 records -
 *                      prose about how the enrichment was assembled, not about
 *                      training
 *   transferRationale   70 KB - the hedges ("no exercise alone teaches shot
 *                      timing") that were never rendered either
 *   movementFamily      21 KB
 *
 * Together a fifth of the file, and 216 KB off the built chunk once removed.
 */
describe("the movement database carries only what something reads", () => {
  const removed = ["sourceSummary", "transferRationale", "movementFamily"] as const;

  it("has records to check", () => {
    expect(enrichedSportMovements.length).toBeGreaterThan(300);
  });

  it("no longer declares the unread fields on its type", () => {
    const type = databaseSource.slice(
      databaseSource.indexOf("export type EnrichedSportMovement"),
      databaseSource.indexOf("export const enrichedSportMovements")
    );
    for (const field of removed) {
      expect(type, `${field} is back on the type`).not.toMatch(new RegExp(`^\\s*${field}:`, "m"));
    }
  });

  it("carries none of them on any record", () => {
    for (const field of removed) {
      const carrying = enrichedSportMovements.filter(
        movement => (movement as unknown as Record<string, unknown>)[field] !== undefined
      );
      expect(carrying.length, `${field} still on ${carrying.length} records`).toBe(0);
    }
  });

  it("keeps the fields something does read", () => {
    const [first] = enrichedSportMovements;
    // exerciseSelectionCautions and sources both have consumers; primeMovers,
    // stabilizers and jointActions drive the Body Lab role context.
    for (const field of [
      "id", "sportId", "label", "bodyActions", "jointActions", "primeMovers",
      "assistingMuscles", "stabilizers", "contractionRoles", "recommendedExercises",
      "exerciseSelectionCautions", "evidenceConfidence", "sources",
    ] as (keyof EnrichedSportMovement)[]) {
      expect(first[field], `${field} is read by the app`).toBeDefined();
    }
  });

  it("stays under the weight that made it worth trimming", () => {
    // A guard against the fields creeping back in one record at a time.
    expect(databaseSource.length).toBeLessThan(750_000);
  });
});
