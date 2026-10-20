/**
 * A scratch build with the test regions given pages, for the heading row and the region grid on a
 * phone before a second region ships (docs/specialization-atlas/10-multi-region.md §9.1, §9.2:
 * wave 0 has the forearm alone). Nothing in the source is changed or committed: at build time a
 * plugin adds the test regions of client/src/components/specialization/__fixtures__/pageRegions.ts
 * to the light index (`regionIndex.ts`) as production regions, and one loader each to
 * `loadRegion.ts`, exactly as the page's tests mock those two modules. The output goes where it is
 * told, never to dist/public.
 *
 *   node docs/specialization-atlas/evidence/page-wave0-2026-10-20/fixture-build.mjs <outDir>
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../..");
const outDir = process.argv[2];
if (!outDir || resolve(outDir).startsWith(resolve(root, "dist"))) throw new Error("Give an output folder outside dist/");
const { build } = await import(resolve(root, "node_modules/vite/dist/node/index.js"));

/** The fixture regions' index records, as pageRegions.ts gives them pages (status production). */
const fixtureIds = ["deltoid", "fx_thigh", "fx_back", "fx_shoulder", "fx_core"];
const fixtureIndex = `
const fixtureRegion = (id, label, sides, words) => ({
  id, label, heading: \`\${label} specialization\`, sortOrder: 90, status: "production", sides, bodyMapKeys: [], catalogKeys: [], regionOnlyTagScope: "primary",
  entryLabel: \`Explore \${label.toLowerCase()} coverage\`,
  wording: { externalGroup: "Other muscles credited here", externalHeading: \`\${label} muscles credited here\`, incidentalWork: "steadying", progressSubtitle: "Performance from your logged sets", ...(words.one ? { sideWord: words.one, sideWordPlural: words.many } : {}), onSideTemplate: words.onSide },
  measurementMetrics: [], measurementDefaults: {},
});
const fixtureRegions = [
  { id: "deltoid", label: "Deltoids", heading: "Deltoid specialization", sortOrder: 90, status: "production", sides: { model: "paired", limb: "arm" }, bodyMapKeys: ["frontDelts", "sideDelts", "rearDelts"], catalogKeys: ["frontDelts", "sideDelts", "rearDelts"], regionOnlyTagScope: "any", entryLabel: "Explore deltoid coverage",
    wording: { externalGroup: "Other muscles credited here", externalHeading: "Deltoid muscles credited here", incidentalWork: "bracing", progressSubtitle: "Circumference, by arm", sideWord: "arm", sideWordPlural: "arms", onSideTemplate: "your {side} shoulder" },
    measurementMetrics: ["circumference_cm"], measurementDefaults: { circumference_cm: { landmark: "Around the shoulder", posture: "arm_relaxed_hanging" } } },
  fixtureRegion("fx_thigh", "Fixture thighs", { model: "paired", limb: "leg" }, { one: "leg", many: "legs", onSide: "your {side} fixture thigh" }),
  fixtureRegion("fx_back", "Fixture back", { model: "paired", limb: "arm" }, { one: "side", many: "sides", onSide: "the {side} side of your fixture back" }),
  fixtureRegion("fx_shoulder", "Fixture shoulders", { model: "paired", limb: "arm" }, { one: "arm", many: "arms", onSide: "your {side} fixture shoulder" }),
  fixtureRegion("fx_core", "Fixture core", { model: "midline" }, { onSide: "your fixture core" }),
];
`;

const registered = "export const registeredRegionIndex: readonly SpecializationRegion[] = [upperArmRegion, forearmRegion];";
const loaderLine = 'forearm: () => import("@shared/specialization/regions/forearm").then((module) => module.forearmRegionData),';
const fixtureRegionsPlugin = {
  name: "scratch-fixture-regions",
  enforce: "pre",
  transform(code, id) {
    if (id.endsWith("/shared/specialization/regionIndex.ts")) {
      if (!code.includes(registered)) throw new Error("regionIndex.ts changed: update the fixture build");
      return code.replace(registered, `${fixtureIndex}\nexport const registeredRegionIndex: readonly SpecializationRegion[] = [upperArmRegion, forearmRegion, ...(fixtureRegions as SpecializationRegion[])].sort((a, b) => a.sortOrder - b.sortOrder);`);
    }
    if (id.endsWith("/client/src/lib/specialization/loadRegion.ts")) {
      if (!code.includes(loaderLine)) throw new Error("loadRegion.ts changed: update the fixture build");
      const fixtures = fixtureIds.map((fixture) => `  ${fixture}: () => import("@/components/specialization/__fixtures__/pageRegions").then((module) => module.pageFixtures.${fixture}),`).join("\n");
      return code.replace(loaderLine, `${loaderLine}\n${fixtures}`);
    }
    return null;
  },
};

await build({ configFile: resolve(root, "vite.config.ts"), plugins: [fixtureRegionsPlugin], build: { outDir: resolve(outDir), emptyOutDir: true }, logLevel: "warn" });
console.log(`Fixture build written to ${resolve(outDir)}`);
