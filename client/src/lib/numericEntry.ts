/**
 * What a typed weight or load becomes while it is still being typed: digits and one decimal
 * point, with a half-typed "2." kept so the next digit has somewhere to go.
 *
 * A comma is read as the decimal point. The iOS and Android decimal keypad shows the
 * locale's separator, and in German, French, Spanish, Italian and Dutch that is a comma and
 * nothing else. Stripping it turned "72,5" into 725 and left those athletes no way to type
 * a fraction at all. When a point is also present the commas are grouping, as in a pasted
 * "1,000.5", and are dropped instead.
 */
export function decimalEntryText(value: string, maxDecimals = 2): string {
  const pointed = value.includes(",") && value.includes(".") ? value.replace(/,/g, "") : value.replace(/,/g, ".");
  const digitsAndDot = pointed.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = digitsAndDot.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, maxDecimals)}` : whole;
}
