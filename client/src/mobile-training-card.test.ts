import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./mobile-training-card.css", import.meta.url), "utf8");

/**
 * Split at the real breakpoint, not at a mention of it.
 *
 * The file's own header comment names the media query while explaining why the
 * rules left it, so a plain indexOf finds the prose rather than the block. The
 * at-rule is matched at the start of a line instead.
 */
const breakpoint = stylesheet.search(/^@media \(max-width: 640px\)/m);
const phoneBlock = stylesheet.slice(breakpoint);
/** Everything that applies at every width. */
const everyWidth = stylesheet.slice(0, breakpoint);

/** The declarations of the first rule whose selector list starts with `selector`. */
function declarations(css: string, selector: string) {
  const at = css.indexOf(selector);
  if (at < 0) return "";
  const open = css.indexOf("{", at);
  return css.slice(open + 1, css.indexOf("}", open));
}

describe("Training Day prescription card layout above the phone breakpoint", () => {
  it("lays the card out at every width, not only on a phone", () => {
    // The whole stylesheet used to sit inside the phone media query, so above
    // 640px the card had no layout at all: the fields had no chrome and no gap
    // after their own labels, and "Duplicate" escaped its button as raw 16px
    // text over the reorder chevrons.
    for (const rule of [".prescription-editor {", ".prescription-primary {", ".prescription-sets-row {", ".set-stepper {", ".duplicate-prescription {", ".prescription-actions {"]) {
      expect(everyWidth, `${rule} should be laid out at every width`).toContain(rule);
    }
  });

  it("gives the fields and the duplicate control visible chrome at every width", () => {
    for (const rule of [".duplicate-prescription {", ".prescription-reps,", ".set-stepper {"]) {
      const body = declarations(everyWidth, rule);
      expect(body, `${rule} has no border`).toContain("border:");
      expect(body, `${rule} has no background`).toContain("background:");
    }
  });

  it("meets the tap-target floor at every width, not only on a phone", () => {
    // These are edited in a gym, on a phone, one-handed - but a 44px control is
    // no worse on a laptop, so the floor is not a phone-only concession.
    expect(declarations(everyWidth, ".set-stepper button {")).toContain("height: 44px");
    expect(declarations(everyWidth, ".prescription-reps,")).toContain("min-height: 44px");
  });

  it("keeps the phone breakpoint for what is genuinely phone-specific", () => {
    // Floating reorder controls and edge-to-edge padding stay; they are not the
    // card's only layout.
    expect(phoneBlock).toContain(".day-orderable-exercise .day-order-controls");
    expect(phoneBlock).toContain(".prescription-editor { padding: 0 .8rem .9rem;");
  });
});

describe("mobile Training Day card action layout", () => {
  it("keeps ordering controls compactly within the card header and clear of the disclosure chevron", () => {
    expect(stylesheet).toContain(".day-orderable-exercise .day-order-controls { position: absolute !important; top: .7rem; right: .7rem;");
    expect(stylesheet).toContain("width: 34px; min-width: 34px; height: 44px");
    // The reorder arrows are absolutely positioned over the row, so the summary
    // reserves their width. Measured at 390px and 1366px: without it the chevron
    // renders underneath them and the row looks like it does not open.
    expect(stylesheet).toContain("padding: .8rem 5.6rem .8rem .9rem;");
  });

  it("collapses the prescription to what is read and opens to what is edited", () => {
    expect(stylesheet).toContain(".custom-prescription > summary.custom-row");
    expect(stylesheet).toContain("grid-template-columns: 2.1rem minmax(0, 1fr) auto");
    // The exercise name is the thing being scanned for, so it wraps rather than
    // truncating the way it did when a full-width Duplicate button shared the row.
    const nameRule = stylesheet.match(/\.custom-row-identity strong \{[^}]*\}/)?.[0] ?? "";
    expect(nameRule).not.toContain("nowrap");
    expect(nameRule).not.toContain("text-overflow");
    expect(stylesheet).toContain(".custom-prescription[open] > summary .custom-row-chevron");
  });

  it("puts the row's actions in their own row at the foot, not through the fields", () => {
    // "Mark complete" used to be a full-width slab between the inputs, and the
    // remove button ran off the right edge of a phone.
    const actions = declarations(stylesheet, ".prescription-actions {");
    expect(actions).toContain("flex-wrap: wrap");
    expect(actions).toContain("border-top:");
    expect(declarations(stylesheet, ".prescription-actions .remove-prescription {")).toContain("width: 44px");
  });
});

/**
 * A prescription can ask for a different target per set, so the editor has a
 * field per set. Twelve of them stacked one to a line would push effort, rest
 * and the actions off the screen entirely.
 */
describe("per-set rep targets", () => {
  /**
   * Eight uppercase micro-labels in four treatments, five of which were verbs.
   * A command set in the idiom used for naming a field reads as a heading, and a
   * row where everything is a heading is a row that shouts.
   */
  it("says commands in a different voice from labels", () => {
    const commands = declarations(stylesheet, ".prescription-editor :is(.prescription-vary, .prescription-undo),");
    expect(commands).toContain("text-transform: none");
    const labels = declarations(stylesheet, ".prescription-editor :is(.metric-label, .prescription-set-list label)");
    expect(labels).toContain("text-transform: uppercase");
    expect(labels).toContain("letter-spacing: .1em");
  });

  it("lays the set fields out across the row rather than one per line", () => {
    expect(declarations(everyWidth, ".prescription-set-list {")).toContain("grid-template-columns: repeat(auto-fill");
  });

  it("makes the way in and out of per-set editing a real control, not an underlined word", () => {
    const vary = declarations(everyWidth, ".prescription-vary {");
    expect(vary).toContain("padding:");
    expect(vary).toContain("border-radius:");
  });

  /**
   * `.apex-content :is(button, summary)` sets a 44px tap floor that outranks
   * anything this file says, so a smaller height here is not a smaller control -
   * it is a line describing a row nobody has ever seen. The row carried four of
   * them (32px twice, 40px twice) and one `min-height: 40px` on the selects that
   * DID win, which is why Effort and Rest sat 4px short of every other control.
   */
  it("declares no control height the app's tap floor would overrule", () => {
    const heights = [...stylesheet.matchAll(/min-height:\s*(\d+(?:\.\d+)?)(px|rem)/g)]
      .map((match) => (match[2] === "rem" ? Number(match[1]) * 16 : Number(match[1])))
      .filter((px) => px < 44);
    expect(heights, `these heights are below the 44px floor and cannot render: ${heights.join(", ")}`).toEqual([]);
  });

  it("ships no styles for the editor it replaced", () => {
    // Rules for markup nothing renders are dead weight in every athlete's
    // download, and they read as if the old layout is still there.
    for (const dead of ["custom-prescription-inputs", "custom-detail-row", "custom-row-actions"]) {
      expect(stylesheet, `${dead} should not survive the rewritten row`).not.toContain(dead);
    }
  });
});
