#!/usr/bin/env python3
"""
The forearm's Drawing plates, built once from the owner's mesh-plate package (23 Oct 2026).

The package (design/specialization/forearm-plates/upload/, as received) ships six shaded
720 x 980 renders (anterior, posterior and lateral, each at surface and deep) and 30 per-muscle
alpha masks, about 12.6 MB in all. This script turns them into what the app serves:

  client/public/assets/anatomy/forearm-plates/<pass>.webp         the plate, cropped, WebP q80
  client/public/assets/anatomy/forearm-plates/<pass>.labels.png   one 8-bit label image per pass
  client/public/assets/anatomy/forearm-plates/SHA256SUMS.txt      the outputs' checksums
  shared/specialization/regions/forearm/plates.generated.ts       frame, passes, label order

Usage (Python 3 with Pillow and NumPy; neither is an app dependency):

  python3 design/specialization/forearm-plates/build_plates.py <package mesh-plates folder> [--evidence <dir>]

The 12.6 MB originals are not committed; their SHA-256 sums are written into the generated
file's header, so a rebuild can be checked against the same inputs.

What it does to each pass:

1. Frame. One crop for all six passes: the union of every plate's and every mask's bounding box,
   plus MARGIN pixels. The package rendered every pass from one centre with one orthographic
   scale, so one frame keeps the arm exactly where it was: switching view or layer never moves
   the arm or changes the drawing's height on the page.
2. Background. The plates already have a transparent background (film_transparent in the
   generator). A plate that does not (opaque corners) has the near-white pixels connected to its
   border keyed out; the script says how many.
3. Labels. The masks are each muscle rendered alone (the generator hides every other mesh), so
   they overlap wherever one muscle lies behind another, and they cover muscle hidden behind bone.
   One label per pixel means deciding which muscle the plate shows there:
   - a pixel is a candidate for a muscle where its mask's alpha is over MASK_ON;
   - it is labelled only where the plate shows muscle (red over green and blue), so bone in front
     of a muscle stays unlabelled and is never tinted;
   - where several masks overlap, the plate's colour is predicted from each candidate's own
     shading (its mask render), with a per-muscle linear fit learnt where that muscle's mask is
     the only one; the candidate whose prediction is closest, averaged over a (2 FIT_RADIUS + 1)
     square, wins. The front muscle's shading is what the plate shows;
   - a 5 x 5 majority vote among candidates, twice, then islands under MIN_ISLAND pixels are
     given to the neighbouring candidate they touch most.
   Pixel value = muscle index (1..n, ordered top to bottom by centroid), 0 = none.
4. Encoding. Plate: RGBA WebP, quality 80, method 6 (fully transparent pixels' colour dropped).
   Labels: 8-bit greyscale PNG, no gamma or colour chunk, so a canvas reads the indexes back
   exactly.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT_ASSETS = ROOT / "client/public/assets/anatomy/forearm-plates"
OUT_TS = ROOT / "shared/specialization/regions/forearm/plates.generated.ts"
PUBLIC_PREFIX = "assets/anatomy/forearm-plates"

# The package's camera names and the page's view ids and words (the forearm drawing's own).
VIEWS = {"anterior": "palm", "posterior": "back", "lateral": "thumb"}
PASS_ORDER = ["anterior-surface", "anterior-deep", "posterior-surface", "posterior-deep", "lateral-surface", "lateral-deep"]

MARGIN = 8
MASK_ON = 100
FIT_RADIUS = 4
VOTE_RADIUS = 2
MIN_ISLAND = 40
MIN_AREA = 30
WEBP_QUALITY = 80


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def box_sum(a: np.ndarray, r: int) -> np.ndarray:
    """Sum over the (2r+1)^2 square round each pixel, zero outside."""
    k = 2 * r + 1
    p = np.pad(a.astype(np.float64), ((r + 1, r), (r + 1, r)))
    c = p.cumsum(0).cumsum(1)
    return c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]


def key_out_white(rgba: np.ndarray) -> int:
    """Makes near-white pixels connected to the border transparent, in place. Returns how many."""
    h, w = rgba.shape[:2]
    corners = [rgba[0, 0], rgba[0, w - 1], rgba[h - 1, 0], rgba[h - 1, w - 1]]
    if all(c[3] == 0 for c in corners):
        return 0
    white = (rgba[..., 3] > 0) & (rgba[..., :3].min(axis=2) >= 245)
    seen = np.zeros((h, w), bool)
    queue = deque((y, x) for y in range(h) for x in (0, w - 1) if white[y, x])
    queue.extend((y, x) for x in range(w) for y in (0, h - 1) if white[y, x])
    for y, x in queue:
        seen[y, x] = True
    count = 0
    while queue:
        y, x = queue.popleft()
        rgba[y, x, 3] = 0
        count += 1
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and white[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return count


def muscle_pixels(plate: np.ndarray) -> np.ndarray:
    """Where the plate shows muscle (the generator's muscles are reds; bone is a pale grey)."""
    rgb = plate[..., :3].astype(np.float64)
    red = rgb[..., 0]
    other = np.maximum(rgb[..., 1], rgb[..., 2])
    return (plate[..., 3] > 0) & ((red - other) > 0.12 * np.maximum(red, 1))


def resolve_labels(plate: np.ndarray, masks: list[np.ndarray]) -> np.ndarray:
    """One label per pixel (0 none, k + 1 for masks[k]): the muscle the plate shows there."""
    rgb = plate[..., :3].astype(np.float64)
    h, w = rgb.shape[:2]
    alpha = np.stack([m[..., 3] for m in masks])
    on = alpha > MASK_ON
    count = on.sum(0)
    muscle = muscle_pixels(plate)
    errors = []
    for k, mask in enumerate(masks):
        alone = on[k] & (count == 1) & (plate[..., 3] == 255) & muscle
        shade = mask[..., :3].astype(np.float64)
        if alone.sum() < 20:
            alone = on[k] & muscle
        design = np.c_[np.ones(int(alone.sum())), shade[alone]]
        coef = np.linalg.lstsq(design, rgb[alone], rcond=None)[0]
        predicted = (np.c_[np.ones(h * w), shade.reshape(-1, 3)] @ coef).reshape(h, w, 3)
        error = np.sqrt(((predicted - rgb) ** 2).sum(2))
        valid = on[k] & muscle
        smooth = box_sum(np.where(valid, error, 0), FIT_RADIUS) / np.maximum(box_sum(valid, FIT_RADIUS), 1e-6)
        errors.append(np.where(valid, smooth, np.inf))
    stacked = np.stack(errors)
    labels = np.where((count > 0) & muscle, stacked.argmin(0) + 1, 0)
    for _ in range(2):
        votes = np.stack([box_sum(labels == k + 1, VOTE_RADIUS) for k in range(len(masks))])
        votes[~on] = -1
        labels = np.where(labels > 0, votes.argmax(0) + 1, 0)
    return merge_islands(labels, on)


def merge_islands(labels: np.ndarray, on: np.ndarray) -> np.ndarray:
    """Gives each patch under MIN_ISLAND pixels to the neighbouring candidate it touches most."""
    h, w = labels.shape
    out = labels.copy()
    seen = np.zeros((h, w), bool)
    for y0, x0 in zip(*np.nonzero(labels)):
        if seen[y0, x0]:
            continue
        own = labels[y0, x0]
        patch = [(y0, x0)]
        seen[y0, x0] = True
        queue = deque(patch)
        touching: dict[int, int] = {}
        while queue:
            y, x = queue.popleft()
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if not (0 <= ny < h and 0 <= nx < w):
                    continue
                other = labels[ny, nx]
                if other == own and not seen[ny, nx]:
                    seen[ny, nx] = True
                    patch.append((ny, nx))
                    queue.append((ny, nx))
                elif other not in (0, own):
                    touching[int(other)] = touching.get(int(other), 0) + 1
        if len(patch) >= MIN_ISLAND or not touching:
            continue
        for other, _ in sorted(touching.items(), key=lambda item: -item[1]):
            ys, xs = zip(*patch)
            if on[other - 1][list(ys), list(xs)].mean() > 0.5:
                out[list(ys), list(xs)] = other
                break
    return out


def bbox(alpha: np.ndarray) -> tuple[int, int, int, int] | None:
    ys, xs = np.nonzero(alpha > 0)
    if not len(ys):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def encode_webp(rgba: np.ndarray) -> bytes:
    buffer = io.BytesIO()
    Image.fromarray(rgba, "RGBA").save(buffer, "WEBP", quality=WEBP_QUALITY, method=6, exact=False)
    return buffer.getvalue()


def encode_labels(labels: np.ndarray) -> bytes:
    buffer = io.BytesIO()
    Image.fromarray(labels.astype(np.uint8), "L").save(buffer, "PNG", optimize=True)
    return buffer.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("source", type=Path, help="the package's public/assets/anatomy/mesh-plates folder")
    parser.add_argument("--evidence", type=Path, help="also write label overlays here, to check the labels by eye")
    args = parser.parse_args()
    source: Path = args.source
    manifest = json.loads((source / "manifest.json").read_text())
    if list(sorted(manifest["passes"])) != sorted(PASS_ORDER):
        raise SystemExit(f"expected the passes {PASS_ORDER}, found {list(manifest['passes'])}")

    inputs: dict[str, str] = {"manifest.json": sha256(source / "manifest.json")}
    plates: dict[str, np.ndarray] = {}
    masks: dict[str, list[np.ndarray]] = {}
    keyed: dict[str, int] = {}
    for pass_id in PASS_ORDER:
        path = source / f"{pass_id}.png"
        inputs[path.name] = sha256(path)
        rgba = np.array(Image.open(path).convert("RGBA"))
        keyed[pass_id] = key_out_white(rgba)
        plates[pass_id] = rgba
        masks[pass_id] = []
        for slug in manifest["passes"][pass_id]["muscles"]:
            mask_path = source / f"{pass_id}__{slug}.png"
            inputs[mask_path.name] = sha256(mask_path)
            masks[pass_id].append(np.array(Image.open(mask_path).convert("RGBA")))

    boxes = [bbox(plates[p][..., 3]) for p in PASS_ORDER] + [bbox(m[..., 3]) for p in PASS_ORDER for m in masks[p]]
    boxes = [b for b in boxes if b]
    height, width = plates[PASS_ORDER[0]].shape[:2]
    left = max(0, min(b[0] for b in boxes) - MARGIN)
    top = max(0, min(b[1] for b in boxes) - MARGIN)
    right = min(width, max(b[2] for b in boxes) + MARGIN)
    bottom = min(height, max(b[3] for b in boxes) + MARGIN)
    frame = (left, top, right, bottom)
    fw, fh = right - left, bottom - top

    OUT_ASSETS.mkdir(parents=True, exist_ok=True)
    passes = []
    overlays = []
    sums = []
    palette = np.array([(230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48), (145, 30, 180), (70, 240, 240)])
    for pass_id in PASS_ORDER:
        slugs = manifest["passes"][pass_id]["muscles"]
        labels = resolve_labels(plates[pass_id], masks[pass_id])
        labels[plates[pass_id][..., 3] == 0] = 0
        crop_labels = labels[top:bottom, left:right]
        crop_plate = plates[pass_id][top:bottom, left:right].copy()
        crop_plate[crop_plate[..., 3] == 0, :3] = 0

        # Indexes ordered top to bottom (then left to right) by where each muscle's label sits.
        found = []
        for k, slug in enumerate(slugs):
            ys, xs = np.nonzero(crop_labels == k + 1)
            if len(ys) < MIN_AREA:
                print(f"  {pass_id}: {slug} shows {len(ys)} px, under {MIN_AREA}: left off this pass")
                continue
            found.append((float(ys.mean()), float(xs.mean()), k, slug, int(len(ys))))
        found.sort()
        remap = np.zeros(len(slugs) + 1, np.uint8)
        muscles = []
        for index, (_, _, k, slug, area) in enumerate(found, start=1):
            remap[k + 1] = index
            muscles.append({"slug": slug, "area": area})
        final = remap[crop_labels]

        image_bytes = encode_webp(crop_plate)
        label_bytes = encode_labels(final)
        image_name, labels_name = f"{pass_id}.webp", f"{pass_id}.labels.png"
        (OUT_ASSETS / image_name).write_bytes(image_bytes)
        (OUT_ASSETS / labels_name).write_bytes(label_bytes)
        sums += [(hashlib.sha256(image_bytes).hexdigest(), image_name), (hashlib.sha256(label_bytes).hexdigest(), labels_name)]
        camera, layer = pass_id.split("-")
        passes.append({
            "id": pass_id, "view": VIEWS[camera], "layer": layer,
            "image": f"{PUBLIC_PREFIX}/{image_name}", "labels": f"{PUBLIC_PREFIX}/{labels_name}",
            "bytes": {"image": len(image_bytes), "labels": len(label_bytes)}, "muscles": muscles,
        })
        if args.evidence:
            shown = crop_plate[..., :3].astype(np.float64)
            shown[crop_plate[..., 3] == 0] = 255
            tinted = final > 0
            shown[tinted] = shown[tinted] * 0.4 + palette[(final[tinted] - 1) % len(palette)] * 0.6
            overlays.append(Image.fromarray(shown.astype(np.uint8)))

    with (OUT_ASSETS / "SHA256SUMS.txt").open("w") as handle:
        for digest, name in sums:
            handle.write(f"{digest}  {name}\n")

    total = sum(p["bytes"]["image"] + p["bytes"]["labels"] for p in passes)
    lines = [
        'import type { DiagramLayerId, DiagramViewId } from "../../types";',
        "",
        "/**",
        " * Generated by design/specialization/forearm-plates/build_plates.py from the owner's mesh-plate",
        " * package (23 Oct 2026). Do not edit by hand: rerun the script on the package's mesh-plates folder.",
        " *",
        f" * One frame for every pass: {fw} x {fh} px, cut from the 720 x 980 renders at ({left}, {top}).",
        f" * Served from client/public/{PUBLIC_PREFIX}/ ({total} bytes in all; SHA256SUMS.txt there).",
        " * Each label image's pixel value is a muscle index into `muscles` (1-based), 0 = none.",
        " *",
        " * Inputs (SHA-256):",
    ]
    lines += [f" *   {digest}  {name}" for name, digest in sorted(inputs.items())]
    lines += [
        " */",
        f"export const forearmPlateFrame = {{ width: {fw}, height: {fh} }} as const;",
        "",
        "export interface GeneratedPlatePass {",
        "  id: string;",
        "  view: DiagramViewId;",
        "  layer: DiagramLayerId;",
        "  image: string;",
        "  labels: string;",
        "  bytes: { image: number; labels: number };",
        "  /** In label order: index 1 is the first. `slug` is the package's muscle id; `area` the pixels it shows. */",
        "  muscles: readonly { slug: string; area: number }[];",
        "}",
        "",
        "export const forearmPlatePasses: readonly GeneratedPlatePass[] = [",
    ]
    for p in passes:
        muscles = ", ".join(f'{{ slug: "{m["slug"]}", area: {m["area"]} }}' for m in p["muscles"])
        lines.append(
            f'  {{ id: "{p["id"]}", view: "{p["view"]}", layer: "{p["layer"]}", image: "{p["image"]}", labels: "{p["labels"]}", '
            f'bytes: {{ image: {p["bytes"]["image"]}, labels: {p["bytes"]["labels"]} }}, muscles: [{muscles}] }},'
        )
    lines += ["];", ""]
    OUT_TS.write_text("\n".join(lines))

    print(f"frame {fw} x {fh} at ({left}, {top}); keyed-out white pixels: {keyed}")
    print(f"{'pass':<20}{'plate':>9}{'labels':>9}{'sum':>9}  muscles")
    for p in passes:
        b = p["bytes"]
        print(f"{p['id']:<20}{b['image']:>9}{b['labels']:>9}{b['image'] + b['labels']:>9}  {', '.join(m['slug'] for m in p['muscles'])}")
    print(f"{'total':<20}{'':>9}{'':>9}{total:>9}")
    if args.evidence:
        args.evidence.mkdir(parents=True, exist_ok=True)
        sheet = Image.new("RGB", (fw * len(overlays), fh), "white")
        for index, overlay in enumerate(overlays):
            sheet.paste(overlay, (index * fw, 0))
        sheet.save(args.evidence / "plate-labels.png", optimize=True)
        print(f"wrote {args.evidence / 'plate-labels.png'}")


if __name__ == "__main__":
    main()
