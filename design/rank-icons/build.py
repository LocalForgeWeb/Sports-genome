#!/usr/bin/env python3
"""
Builds the runtime rank icons from the approved masters.

    python3 design/rank-icons/build.py            # writes client/public/rank-icons/*.webp
    python3 design/rank-icons/build.py --preview  # also writes a lineup on navy to /tmp for inspection

Reads  design/rank-icons/source/<rank>.png   (the approved artwork, untouched, original resolution)
Writes client/public/rank-icons/<rank>.webp      384 px, for the rank card and any featured use
       client/public/rank-icons/<rank>-128.webp  128 px, for compact rows and the legend

What it does, and only this:
  1. Finds the artwork's visible bounds (alpha > 8) and crops to them.
  2. Scales so every badge has the same visible area (sqrt of alpha-weighted pixels =
     60% of the canvas side), capped so no wing or crown tip comes within 4% of an edge.
     Proportions are kept: nothing is stretched to fill the square.
  3. Centres the crop on a transparent square canvas and encodes it.
The pixels themselves are never recoloured, filtered, masked or traced; black artwork and
transparent cut-outs survive because the alpha channel is carried through as is. Resampling
is done on premultiplied alpha so edges keep their antialiasing without dark fringes.

Needs Pillow and numpy (`pip install pillow numpy`). A rank whose master is missing is
skipped with a warning, never substituted.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "design" / "rank-icons" / "source"
OUT = ROOT / "client" / "public" / "rank-icons"

# Order is the rank order; the file name is the rank id with "_" written as "-".
RANK_FILES = ["prospect", "jv", "varsity", "regional", "state", "national", "world-stage"]

CANVAS = 1024            # working canvas, before the runtime sizes are cut from it
TARGET_SQRT_AREA = 0.60  # every badge: sqrt(visible area) = this fraction of the canvas side
MAX_EXTENT = 0.92        # ...unless a tip would pass this fraction, in which case it is held here
RUNTIME = [(384, ""), (128, "-128")]


def normalise(master: Image.Image) -> tuple[Image.Image, dict]:
    rgba = master.convert("RGBA")
    alpha = np.asarray(rgba)[..., 3]
    ys, xs = np.where(alpha > 8)
    if len(ys) == 0:
        raise SystemExit("master has no visible pixels")
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    crop = rgba.crop(box)
    width, height = crop.size
    sqrt_area = float(np.sqrt((alpha[box[1]:box[3], box[0]:box[2]] / 255.0).sum()))

    scale = TARGET_SQRT_AREA * CANVAS / sqrt_area
    cap = MAX_EXTENT * CANVAS / max(width, height)
    held = scale > cap
    scale = min(scale, cap)

    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    # "RGBa" is Pillow's premultiplied mode: resampling in it keeps soft edges clean.
    resized = crop.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(resized, ((CANVAS - size[0]) // 2, (CANVAS - size[1]) // 2))
    report = {
        "source": master.size, "bounds": box, "visible": (width, height),
        "sqrtArea": round(sqrt_area), "scale": round(scale, 4), "heldAtCap": held,
        "onCanvas": size, "extent": round(max(size) / CANVAS, 3),
    }
    return canvas, report


def encode(canvas: Image.Image, rank: str) -> list[Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    for width, suffix in RUNTIME:
        small = canvas.convert("RGBa").resize((width, width), Image.Resampling.LANCZOS).convert("RGBA")
        path = OUT / f"{rank}{suffix}.webp"
        small.save(path, "WEBP", quality=90, alpha_quality=100, method=6)
        written.append(path)
    return written


def preview(canvases: dict[str, Image.Image]) -> Path:
    """The seven-icon lineup (as many as exist) on the app's navy, at three display sizes."""
    navy = (11, 34, 64, 255)
    rows = [(128, 12), (64, 10), (32, 8)]
    gap = 24
    width = 24 + max(len(canvases) * (s + g) for s, g in rows)
    height = 24 + sum(s + 2 * g for s, g in rows)
    sheet = Image.new("RGBA", (width, height), navy)
    y = 24
    for size, g in rows:
        x = 24
        for rank, canvas in canvases.items():
            icon = canvas.convert("RGBa").resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
            sheet.alpha_composite(icon, (x, y))
            x += size + g
        y += size + 2 * g
    path = Path("/tmp/claude-0/-home-user-Sports-genome/d1d9bfed-a6f9-5d87-9151-3620e8194516/scratchpad/rank-icons-lineup.png")
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)
    return path


def main() -> None:
    canvases: dict[str, Image.Image] = {}
    for rank in RANK_FILES:
        master = SOURCE / f"{rank}.png"
        if not master.exists():
            print(f"skip   {rank}: no approved master at {master.relative_to(ROOT)}", file=sys.stderr)
            continue
        canvas, report = normalise(Image.open(master))
        written = encode(canvas, rank)
        canvases[rank] = canvas
        sizes = ", ".join(f"{p.name} {p.stat().st_size // 1024} KB" for p in written)
        print(f"wrote  {rank}: {report} -> {sizes}")
    if "--preview" in sys.argv and canvases:
        print(f"lineup {preview(canvases)}")


if __name__ == "__main__":
    main()
