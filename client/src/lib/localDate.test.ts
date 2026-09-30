import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localDateKey } from "./localDate";

// CI runs in UTC, where the local day and the UTC day agree. Each case sets a
// zone first so the difference the helper exists for actually shows.
const originalZone = process.env.TZ;

describe("localDateKey", () => {
  beforeEach(() => { delete process.env.TZ; });
  afterEach(() => { if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone; });

  it("gives the evening's own day west of UTC, not tomorrow", () => {
    process.env.TZ = "America/New_York";
    // 9:30pm on Sep 27 in New York.
    const evening = new Date("2026-09-28T01:30:00Z");
    expect(evening.toISOString().slice(0, 10)).toBe("2026-09-28");
    expect(localDateKey(evening)).toBe("2026-09-27");
    // Read back at local noon, the key lands on the same day.
    expect(localDateKey(new Date(`${localDateKey(evening)}T12:00:00`))).toBe("2026-09-27");
  });

  it("gives the morning's own day east of UTC, not yesterday", () => {
    process.env.TZ = "Pacific/Auckland";
    // 8:00am on Sep 29 in Auckland.
    const morning = new Date("2026-09-28T19:00:00Z");
    expect(morning.toISOString().slice(0, 10)).toBe("2026-09-28");
    expect(localDateKey(morning)).toBe("2026-09-29");
  });

  it("pads the month and day, and keeps the first minutes of a year in that year", () => {
    process.env.TZ = "America/New_York";
    expect(localDateKey(new Date(2026, 0, 1, 0, 15))).toBe("2026-01-01");
    expect(localDateKey(new Date(2026, 0, 31, 23, 30))).toBe("2026-01-31");
    expect(localDateKey(new Date(2026, 8, 5, 12))).toBe("2026-09-05");
  });
});
