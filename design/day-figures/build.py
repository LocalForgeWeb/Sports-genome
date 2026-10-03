#!/usr/bin/env python3
"""
Builds Home's training-day figures from the supplied artwork.

    python3 design/day-figures/build.py            # writes client/public/day-figures/<split>.webp
    python3 design/day-figures/build.py --preview  # also writes a lineup on navy and on paper for inspection

Reads  design/day-figures/source/<split>.png   the artwork as supplied: a front and a back figure
                                               side by side, the day's muscles in orange, transparent
                                               around them (push.png, pull.png, legs.png, upper.png,
                                               sport-transfer.png)
Writes client/public/day-figures/<split>.webp  720 px wide, for the Home hero (drawn at 152 CSS px,
                                               so 3x displays are covered) and anything larger later
       client/public/day-figures/<split>-360.webp  360 px wide, for compact rows

What it does, and only this:
  1. Finds the artwork's visible bounds (alpha > 8) and crops to them, with a 2% margin so a glow
     is not cut flat.
  2. Resizes to the runtime widths on premultiplied alpha, so edges keep their antialiasing
     without dark fringes. Proportions are kept.
  3. Encodes WebP with the alpha channel carried through as is. Nothing is recoloured.
A split whose master is missing is skipped with a note, never substituted with another split's
figure: a Pull day drawn with the Push artwork would teach the wrong muscles.

Needs Pillow and numpy.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "design" / "day-figures" / "source"
OUT = ROOT / "client" / "public" / "day-figures"

# The file name is the split written in lower case with "-" for a space.
SPLITS = ["push", "pull", "legs", "upper", "sport-transfer"]
RUNTIME = [(720, ""), (360, "-360")]
MARGIN = 0.02


def trim(master: Image.Image) -> tuple[Image.Image, dict]:
    rgba = master.convert("RGBA")
    alpha = np.asarray(rgba)[..., 3]
    ys, xs = np.where(alpha > 8)
    if len(ys) == 0:
        raise SystemExit("master has no visible pixels")
    pad_x = round(MARGIN * (xs.max() - xs.min()))
    pad_y = round(MARGIN * (ys.max() - ys.min()))
    box = (max(0, int(xs.min()) - pad_x), max(0, int(ys.min()) - pad_y), min(rgba.width, int(xs.max()) + 1 + pad_x), min(rgba.height, int(ys.max()) + 1 + pad_y))
    crop = rgba.crop(box)
    return crop, {"source": master.size, "bounds": box, "visible": crop.size}


def encode(crop: Image.Image, split: str) -> list[tuple[Path, tuple[int, int]]]:
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    for width, suffix in RUNTIME:
        height = max(1, round(crop.height * width / crop.width))
        small = crop.convert("RGBa").resize((width, height), Image.Resampling.LANCZOS).convert("RGBA")
        path = OUT / f"{split}{suffix}.webp"
        small.save(path, "WEBP", quality=88, alpha_quality=100, method=6)
        written.append((path, (width, height)))
    return written


def preview(crops: dict[str, Image.Image]) -> Path:
    """Every figure that exists, at the hero's size, on the app's navy and on paper."""
    size = 152 * 3
    gap = 24
    tiles = []
    for split, crop in crops.items():
        height = round(crop.height * size / crop.width)
        small = crop.convert("RGBa").resize((size, height), Image.Resampling.LANCZOS).convert("RGBA")
        for bg in [(11, 34, 64, 255), (247, 244, 236, 255)]:
            tile = Image.new("RGBA", small.size, bg)
            tile.alpha_composite(small)
            tiles.append(tile)
    width = gap + sum(t.width + gap for t in tiles)
    height = 2 * gap + max(t.height for t in tiles)
    sheet = Image.new("RGBA", (width, height), (128, 128, 128, 255))
    x = gap
    for tile in tiles:
        sheet.alpha_composite(tile, (x, gap))
        x += tile.width + gap
    path = Path("/tmp/claude-0/-home-user-Sports-genome/d1d9bfed-a6f9-5d87-9151-3620e8194516/scratchpad/day-figures-lineup.png")
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)
    return path


def main() -> None:
    crops: dict[str, Image.Image] = {}
    manifest: dict[str, dict] = {}
    for split in SPLITS:
        master = SOURCE / f"{split}.png"
        if not master.exists():
            print(f"skip   {split}: no artwork at {master.relative_to(ROOT)}", file=sys.stderr)
            continue
        crop, report = trim(Image.open(master))
        written = encode(crop, split)
        crops[split] = crop
        manifest[split] = {"width": written[0][1][0], "height": written[0][1][1]}
        sizes = ", ".join(f"{p.name} {p.stat().st_size // 1024} KB" for p, _ in written)
        print(f"wrote  {split}: {report} -> {sizes}")
    print("sizes  " + json.dumps(manifest))
    if "--preview" in sys.argv and crops:
        print(f"lineup {preview(crops)}")


if __name__ == "__main__":
    main()
