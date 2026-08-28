# Upright Home Screen Icon Validation — 2026-08-28

The supplied square upright S/DNA artwork was preserved without cropping and deterministically resized into 64 × 64, 180 × 180, 192 × 192, and 512 × 512 PNG assets. The 64px favicon, 180px Apple touch icon, and standalone manifest’s 192px and 512px icon entries now reference those new durable assets.

Local asset checks followed redirects and returned HTTP 200 for each icon variant. The manifest retains `display: "standalone"` and uses the deep-navy `#0b2240` background and theme colors. The focused icon metadata and mobile-header regression suite passed, as did the full test suite and production build.

The visible in-app header also uses the supplied upright mark, while its screen title plus sport, goal, and training-days context chips were retained unchanged. This validates code and browser behavior only. A real iPhone may retain the former icon in an existing Home Screen web app until that saved instance is removed and re-added after the published update.
