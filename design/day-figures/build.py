#!/usr/bin/env python3
"""
Builds Home's training-day figures.

    python3 design/day-figures/build.py                        # writes client/public/day-figures/<split>.webp
    python3 design/day-figures/build.py --preview <lineup.png> # also writes a lineup on navy and on paper for inspection

Reads  design/day-figures/source/<split>.png   artwork as supplied: a front and a back figure side by
                                               side, the day's muscles in orange, transparent around
                                               them. Push is supplied (push.png).
       derive.py                                every split with no supplied master is drawn from the
                                               Push master by derive.py: the same figures with that
                                               day's muscle panels painted instead (pull, legs, upper,
                                               sport-transfer, full-body). A master saved in source/
                                               later replaces its derived figure.
Writes client/public/day-figures/<split>.webp  720 px wide, for the Home hero (drawn at 152 CSS px,
                                               so 3x displays are covered) and anything larger later
       client/public/day-figures/<split>-360.webp  360 px wide, for compact rows

What it does with each master, and only this:
  1. Finds the artwork's visible bounds (alpha > 8) and crops to them, with a 2% margin so a glow
     is not cut flat.
  2. Resizes to the runtime widths on premultiplied alpha, so edges keep their antialiasing
     without dark fringes. Proportions are kept.
  3. Encodes WebP with the alpha channel carried through as is.
A split is never drawn with another split's figure: a Pull day drawn with the Push artwork would
teach the wrong muscles.

Needs Pillow, numpy and scipy.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "design" / "day-figures" / "source"
OUT = ROOT / "client" / "public" / "day-figures"

# The file name is the split written in lower case with "-" for a space.
SPLITS = ["push", "pull", "legs", "upper", "sport-transfer", "full-body"]
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


def preview(crops: dict[str, Image.Image], path: Path) -> Path:
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
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)
    return path


def main() -> None:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import derive

    supplied = {split for split in SPLITS if (SOURCE / f"{split}.png").exists()}
    derived = derive.derive([split for split in SPLITS if split not in supplied])
    crops: dict[str, Image.Image] = {}
    manifest: dict[str, dict] = {}
    for split in SPLITS:
        if split in supplied:
            master, origin = Image.open(SOURCE / f"{split}.png"), "supplied"
        elif split in derived:
            master, origin = derived[split], "derived from push.png"
        else:
            print(f"skip   {split}: no artwork at {(SOURCE / f'{split}.png').relative_to(ROOT)} and none derived", file=sys.stderr)
            continue
        crop, report = trim(master)
        written = encode(crop, split)
        crops[split] = crop
        manifest[split] = {"width": written[0][1][0], "height": written[0][1][1]}
        sizes = ", ".join(f"{p.name} {p.stat().st_size // 1024} KB" for p, _ in written)
        print(f"wrote  {split} ({origin}): {report} -> {sizes}")
    print("sizes  " + json.dumps(manifest))
    if "--preview" in sys.argv and crops:
        at = sys.argv.index("--preview") + 1
        target = Path(sys.argv[at]) if at < len(sys.argv) else Path(tempfile.gettempdir()) / "day-figures-lineup.png"
        print(f"lineup {preview(crops, target)}")


if __name__ == "__main__":
    main()
