/** "1 set", "2 sets": the count and the word that agrees with it, for every place a count is read out. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
