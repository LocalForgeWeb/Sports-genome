# Sports Genome — working rules

## Phone and iOS first (owner, 15 Oct 2026)

Sports Genome is a phone app, built today as a web app and meant to ship later as an iOS app. Every UI and UX change is designed for, and checked on, a phone. Desktop and wide-browser layouts are secondary: they must not break, but they never decide a design.

**Every UI change must be clearly visible and usable on a phone:**

- **Phone widths first.** Design at 390 × 844 (iPhone 13–16). Check 375 × 667 (iPhone SE) and 430 × 932 (Pro Max).
- **Touch targets at least 44 × 44 pt** (Apple's Human Interface Guidelines), with room between neighbours.
- **No hover-only affordances.** Anything that matters is visible at rest: no faint, low-opacity or hover-revealed controls. A new control has to be clearly visible, not merely present.
- **Text inputs at 16 px or larger**, so iOS Safari does not zoom on focus.
- **Safe areas.** Anything pinned to a screen edge (sheets, sticky footers, the bottom nav) pads with `env(safe-area-inset-*)`.
- **Inline, not popups.** Routine questions are asked in place, briefly. Dialogs and sheets are for flows: picking an exercise, confirming something destructive.
- **Undo over confirm** for everyday removals: act at once, offer Undo in the message.
- **Verify before shipping.** Take a phone-viewport screenshot of each changed screen at 390 px, and at 375 px where space is tight, and look at it.
  - The sandbox has Chromium only. Emulate the iPhone (viewport, `isMobile`, `hasTouch`, device scale 3) and report it as headless emulation, not as testing on an iPhone or in Safari.
  - The pattern is in `scripts/perf/measure-client.cjs`: build, serve `dist/public`, seed `localStorage`, open `?workspace=…`.
