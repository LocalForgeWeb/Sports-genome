import { describe, expect, it } from "vitest";
import { decimalEntryText } from "./numericEntry";

/**
 * On a phone set to German, French, Spanish, Italian or Dutch, the decimal keypad's only
 * separator is a comma. It used to be stripped, so "72,5" was saved as 725.
 */
describe("A typed weight keeps its decimal whichever separator the keypad offers", () => {
  it.each([
    ["72,5", "72.5"],
    ["2,", "2."],
    [",5", ".5"],
    ["1,000.5", "1000.5"],
    ["abc12x.3.9def", "12.39"],
    ["72,555", "72.55"],
    ["145.", "145."],
    ["145", "145"],
    ["", ""],
  ])("%s -> %s", (typed, expected) => {
    expect(decimalEntryText(typed)).toBe(expected);
  });

  it("keeps as many decimals as asked for", () => {
    expect(decimalEntryText("72,555", 1)).toBe("72.5");
  });
});
