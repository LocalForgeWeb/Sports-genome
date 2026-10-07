/**
 * Search over the Training terms: a term's name and its aliases first, then its meaning.
 * Deterministic: the same query always lists the same entries in the same order.
 */
export type GlossaryGroup = "Prescription" | "Logging" | "Effort" | "Analysis" | "Strength" | "Sport context";
export const glossaryGroups: GlossaryGroup[] = ["Prescription", "Logging", "Effort", "Analysis", "Strength", "Sport context"];

export type GlossaryEntry = {
  id: string;
  group: GlossaryGroup;
  term: string;
  aliases: readonly string[];
  meaning: string;
  example: string;
  inApp: string;
  misread?: string;
  sources?: readonly { label: string; url: string }[];
};

export const normaliseQuery = (text: string) => text.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9%]+/g, " ").trim();

/** 4 exact term or alias, 3 a term or alias starting with the query, 2 containing it, 1 the meaning containing it. */
function score(entry: GlossaryEntry, query: string): number {
  const names = [entry.term, ...entry.aliases].map(normaliseQuery);
  if (names.some((name) => name === query)) return 4;
  if (names.some((name) => name.startsWith(query) || name.split(" ").some((word) => word.startsWith(query)))) return 3;
  if (names.some((name) => name.includes(query))) return 2;
  return normaliseQuery(`${entry.meaning} ${entry.inApp}`).includes(query) ? 1 : 0;
}

export function searchGlossary(entries: readonly GlossaryEntry[], text: string): GlossaryEntry[] {
  const query = normaliseQuery(text);
  const ordered = [...entries].sort((a, b) => glossaryGroups.indexOf(a.group) - glossaryGroups.indexOf(b.group) || a.term.localeCompare(b.term));
  if (!query) return ordered;
  return ordered
    .map((entry, index) => ({ entry, index, score: score(entry, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.entry);
}
