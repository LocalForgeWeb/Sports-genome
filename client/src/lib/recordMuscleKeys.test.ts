import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { bodyMapKeysForRecordMuscle, catalogKeysForRecordMuscle, recordMuscleAliases } from "./recordMuscleKeys";

describe("one table from record muscle names to muscle keys", () => {
  it("reads the Latin oblique names the records use, so Bridge's oblique prime mover reaches the catalog", () => {
    expect(catalogKeysForRecordMuscle("obliquus externus abdominis")).toEqual(["obliques"]);
    expect(catalogKeysForRecordMuscle("gluteus maximus")).toEqual(["glutes"]);
    expect(catalogKeysForRecordMuscle("erector spinae")).toEqual(["lowerBack"]);
  });

  it("does not read the calf as the arm, or a hamstring as the biceps", () => {
    expect(bodyMapKeysForRecordMuscle("triceps surae")).toEqual(["calves", "soleus"]);
    expect(catalogKeysForRecordMuscle("triceps surae")).toEqual(["calves"]);
    expect(catalogKeysForRecordMuscle("biceps femoris")).toEqual(["hamstrings"]);
    expect(catalogKeysForRecordMuscle("triceps brachii")).toEqual(["triceps"]);
    expect(catalogKeysForRecordMuscle("long head of triceps brachii")).toEqual(["triceps"]);
  });

  it("keeps the body map's own regions and folds them into the catalog key that tags the same tissue", () => {
    expect(bodyMapKeysForRecordMuscle("soleus")).toEqual(["soleus"]);
    expect(catalogKeysForRecordMuscle("soleus")).toEqual(["calves"]);
    expect(bodyMapKeysForRecordMuscle("rhomboid major")).toEqual(["rhomboids"]);
    expect(catalogKeysForRecordMuscle("rhomboid major")).toEqual(["upperBack"]);
    expect(catalogKeysForRecordMuscle("peroneus longus")).toEqual([]);
  });

  it("reads hyphenated names and passes keys through", () => {
    expect(bodyMapKeysForRecordMuscle("rotator-cuff muscles")).toEqual(["rotatorCuff"]);
    expect(bodyMapKeysForRecordMuscle("quads")).toEqual(["quads"]);
  });

  it("maps a group word that is not a muscle to nothing", () => {
    expect(catalogKeysForRecordMuscle("scapular stabilizers")).toEqual([]);
    expect(catalogKeysForRecordMuscle("trunk")).toEqual([]);
  });

  it("only ever produces keys the catalog uses", () => {
    const catalogKeys = new Set(exercises.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles]));
    for (const key of Object.keys(recordMuscleAliases)) {
      for (const folded of catalogKeysForRecordMuscle(key)) expect(catalogKeys.has(folded), `${key} -> ${folded}`).toBe(true);
    }
  });
});
