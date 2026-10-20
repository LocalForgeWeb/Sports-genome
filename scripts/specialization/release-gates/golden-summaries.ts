/**
 * The forearm's golden summaries (docs/specialization-atlas/10-multi-region.md §4.3): every summary
 * of client/src/lib/specialization/__fixtures__/releaseGateHistories.ts, written as the reference
 * that client/src/lib/specialization/golden.test.ts compares the current calculator with.
 *
 * The reference is made with the code the forearm shipped with, never with the code under test:
 * copy the shipped tree outside the repository, put this script and the histories module into it,
 * and run it there.
 *
 *   mkdir -p <scratch>/golden-6738eeb && git archive 6738eeb | tar -x -C <scratch>/golden-6738eeb
 *   ln -s "$PWD/node_modules" <scratch>/golden-6738eeb/node_modules
 *   cp client/src/lib/specialization/__fixtures__/releaseGateHistories.ts <scratch>/golden-6738eeb/client/src/lib/specialization/__fixtures__/
 *   cp scripts/specialization/release-gates/golden-summaries.ts <scratch>/golden-6738eeb/scripts/specialization/release-gates/
 *   (cd <scratch>/golden-6738eeb && npx tsx scripts/specialization/release-gates/golden-summaries.ts --from 6738eeb \
 *     --out "$OLDPWD/client/src/lib/specialization/__fixtures__/goldenSummaries.6738eeb.json")
 *
 * A summary whose JSON is larger than FULL_LIMIT is kept as its totals (`summaryTotals`) and the
 * SHA-256 of its canonical JSON; every other one is kept whole.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { canonicalJson, GOLDEN_NOW, goldenSummaries, summaryTotals } from "../../../client/src/lib/specialization/__fixtures__/releaseGateHistories";

const FULL_LIMIT = 80_000;

const arg = (name: string) => {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
};
const out = arg("--out");
const from = arg("--from");
if (!out || !from) throw new Error("Usage: golden-summaries.ts --from <commit> --out <file.json>");

const cases = goldenSummaries().map(({ id, summary }) => {
  const text = canonicalJson(summary);
  const sha256 = createHash("sha256").update(text).digest("hex");
  return text.length <= FULL_LIMIT ? { id, sha256, summary } : { id, sha256, totals: summaryTotals(summary) };
});
// One case per line, so a changed case is one changed line.
writeFileSync(out, `{"from":${JSON.stringify(from)},"now":${JSON.stringify(GOLDEN_NOW)},"cases":[\n${cases.map((item) => JSON.stringify(item)).join(",\n")}\n]}\n`);
console.log(`${cases.length} summaries (${cases.filter((item) => "summary" in item).length} whole, the rest as totals and SHA-256) written to ${out}`);
