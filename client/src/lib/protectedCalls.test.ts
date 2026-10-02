import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Sep 28 regression brief §7. Four account-only calls were still reachable on the device store
 * after batch 10 said otherwise (auth.passkeys, favorites.set, strengthGenome.setPriority,
 * auth.passkeyRegistrationOptions). Each refusal raised the sign-in notice. This reads the
 * server's protected procedures and checks every client call to one:
 * - a query must say when it is asked (`enabled`), so it can wait for an account session;
 * - a mutation may be called only from a file reviewed for it, listed below with why.
 */
const root = process.cwd();
const routers = readFileSync(resolve(root, "server/routers.ts"), "utf8");

const protectedProcedures = new Set<string>();
let router = "";
for (const line of routers.split("\n")) {
  if (/^\s*\/\//.test(line)) continue;
  const routerMatch = line.match(/^ {2}(\w+): router\(\{/);
  if (routerMatch) router = routerMatch[1];
  const procedure = line.match(/^ {4}(\w+): protectedProcedure\b/);
  if (procedure && router) protectedProcedures.add(`${router}.${procedure[1]}`);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

/** The text of a call's arguments, from its opening parenthesis to the matching close. */
function callArguments(source: string, open: number) {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "(") depth += 1;
    if (source[index] === ")" && --depth === 0) return source.slice(open + 1, index);
  }
  return source.slice(open + 1);
}

const calls = sourceFiles(resolve(root, "client/src")).flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return Array.from(source.matchAll(/trpc\.(\w+)\.(\w+)\.(useQuery|useMutation)\(/g), (match) => ({
    file: relative(resolve(root, "client/src"), path),
    procedure: `${match[1]}.${match[2]}`,
    hook: match[3],
    args: callArguments(source, match.index! + match[0].length - 1),
  })).filter((call) => protectedProcedures.has(call.procedure));
});

/** Reviewed: each of these calls its mutation only when an account session exists. */
const reviewedMutations: Record<string, string> = {
  "components/AthleteAboutMePanel.tsx": "passkey enroll/remove; the Security group renders only with accountSession, and enrollPasskey returns without one",
  "components/EmailAuthScreen.tsx": "passkey enrollment right after a successful sign-in; the screen is not shown in a direct-access build",
  "components/StrengthGenomePanel.tsx": "account branches only: each device-store path (directAccess) writes locally, and Set focus is not offered there",
  "components/WorkoutExecutionPanel.tsx": "the account tracker; not rendered (Home renders DeviceWorkoutTracker)",
  "lib/usePlanSync.ts": "plan save; the hook is enabled only when isAuthenticated",
  "pages/Home.tsx": "favorites.set; toggleFavorite returns before it without isAuthenticated",
};

describe("account-only calls from the client", () => {
  it("reads the server's protected procedures", () => {
    expect(protectedProcedures.size).toBeGreaterThan(20);
    expect(protectedProcedures).toContain("auth.passkeys");
    expect(protectedProcedures).toContain("favorites.set");
  });

  it("asks every protected query only when told to", () => {
    const queries = calls.filter((call) => call.hook === "useQuery");
    expect(queries.length).toBeGreaterThan(0);
    // `enabled: x`, or the shorthand `enabled,` when the hook's own variable carries it.
    expect(queries.filter((call) => !/\benabled\s*[:,}]/.test(call.args)).map((call) => `${call.file}: ${call.procedure}`)).toEqual([]);
  });

  it("calls protected mutations only from files reviewed for it", () => {
    const files = Array.from(new Set(calls.filter((call) => call.hook === "useMutation").map((call) => call.file))).sort();
    expect(files).toEqual(Object.keys(reviewedMutations).sort());
  });
});
