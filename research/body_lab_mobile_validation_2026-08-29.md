# Body Lab mobile validation — 2026-08-29

The generated populated 390×844 Body Lab check confirmed that the third-party portrait SVG now fits wholly inside the responsive mobile canvas: the canvas measured 332×540px and the rendered SVG measured 191×506px, with no clipping. The full front figure is visible and materially larger than the earlier interim 154×408px rendering, while leaving the renderer’s required legend intact.

The generated 390×844 Training Day check confirmed that the prescription surface shows direct **Sets** and **Reps / target** inputs. The explicit Duplicate control created a second Barbell Bench Press row; changing that row to `1` set and `1` repetition left the original row at `3 × 8–12`. The compact header action styling removed the oversized full-width reorder boxes that previously competed with the prescription rows.

At 1366×768, the compact Stack Analysis trigger and the collapsed **Find an exercise** disclosure remained clear beside the saved-week muscle-volume map and pre-training preparation context. The full release candidate passed the complete Vitest suite (103 files, 322 tests), strict TypeScript validation, and a production build.

The generated capture is browser emulation only. It is not a physical iPhone/Safari verification.
