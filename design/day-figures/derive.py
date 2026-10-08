#!/usr/bin/env python3
"""
Draws the training-day figures that were not supplied, from the one that was.

    python3 design/day-figures/derive.py <outDir>   # writes <split>.png masters and a region map for inspection
    (build.py imports it for any split whose master is not in source/)

The supplied Push master (source/push.png) is a front and a back figure drawn as outlined muscle
panels: navy panels, dark outlines, and Push's muscles painted orange. Every other day is the same
drawing with that day's muscles painted instead, so all the figures are one piece of artwork:

  1. Panels. The outlines are the dark pixels (luminance under 40, not orange). They are thickened
     by 2 px to close the hairline gaps where two strokes nearly meet, and what is left is labelled
     into panels, orange and navy apart (the front triceps is orange beside a navy biceps with only
     a faint line between them). Each visible pixel then belongs to its nearest panel, so a panel
     owns its share of the outline band and its anti-aliased edge.
  2. Muscles. Each muscle below is a list of points on the master that fall inside its panels, so
     the mapping reads as anatomy and fails loudly if the artwork changes under it.
  3. A blank figure. Push's orange panels are repainted navy: navy's own shading (lighter at the
     top), with the orange's fine fibre detail kept faintly.
  4. A day. Its panels are painted orange on the blank figure. A panel Push already painted keeps
     the supplied pixels exactly. Any other is shaded as the supplied orange panels are (a fit to
     them: lightest in the middle and towards the top, darker at the lower edge, with fine fibre
     streaks along the panel's long axis), mapped through the supplied orange's own colours. The
     outline is kept: an edge pixel mixes the outline colour and the new fill in the proportion the
     original mixed outline and navy.

Nothing is generated or traced from anywhere else; a day shows exactly the panels listed for it.
Needs Pillow, numpy and scipy.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
MASTER = ROOT / "design" / "day-figures" / "source" / "push.png"

OUTLINE_LUMINANCE = 40
GAP = 2
# How far past a panel's inner edge its repaint reaches: the anti-aliased rim and no further.
EDGE = 2
MIN_PANEL = 60
OUTLINE_RGB = np.array([8.0, 18.0, 33.0])

# Points (x, y) on the 1254 x 1254 master inside each muscle's panels: the front figure is left of
# x = 627, the back figure right of it. Left and right sides are listed separately.
MUSCLES: dict[str, list[tuple[int, int]]] = {
    # Front figure
    "upper trapezius (front)": [(285, 228), (445, 228)],
    "front deltoid": [(200, 292), (528, 292)],
    "pectorals": [(300, 326), (430, 326)],
    "triceps (front)": [(169, 401), (555, 401)],
    "biceps": [(207, 383), (520, 383)],
    "forearms (front)": [(131, 503), (166, 535), (172, 486), (106, 547), (132, 583), (595, 502), (567, 535), (555, 487), (598, 584), (620, 549)],
    "rectus abdominis": [(333, 401), (396, 401), (336, 445), (393, 445), (341, 491), (394, 491), (367, 578)],
    "serratus anterior": [(286, 454), (441, 454), (257, 392), (472, 392), (256, 415), (472, 415), (240, 406), (487, 407)],
    "external obliques (front)": [(286, 527), (449, 527)],
    "hip flexors and adductors": [(259, 580), (475, 580), (319, 596), (307, 609), (414, 595), (428, 605), (328, 667), (348, 694), (407, 667), (387, 705)],
    "quadriceps": [(283, 676), (241, 714), (309, 768), (451, 676), (493, 714), (425, 768)],
    "calves (front)": [(223, 937), (295, 938), (271, 1027), (510, 936), (439, 938), (462, 1027)],
    # Back figure
    "trapezius": [(861, 251), (923, 251), (892, 186), (810, 255), (981, 255)],
    "mid and lower trapezius": [(860, 364), (931, 364)],
    "rear deltoid": [(745, 285), (1045, 285)],
    "rotator cuff and teres": [(828, 300), (963, 300), (798, 300), (993, 300), (795, 339), (996, 339)],
    "latissimus dorsi": [(820, 420), (971, 420)],
    "erector spinae": [(872, 500), (917, 500)],
    "external obliques (back)": [(815, 504), (982, 505)],
    "triceps (back)": [(722, 402), (1069, 403)],
    "forearms (back)": [(669, 486), (685, 580), (1124, 487), (1114, 583)],
    "gluteus medius": [(801, 567), (991, 566)],
    "gluteus maximus": [(845, 611), (951, 611)],
    "hamstrings": [(799, 754), (835, 790), (859, 729), (802, 821), (995, 754), (959, 790), (934, 729), (991, 822)],
    "calves (back)": [(773, 921), (816, 925), (782, 1036), (754, 1010), (790, 1061), (976, 934), (1017, 915), (1010, 1036), (1038, 1010), (990, 1040)],
}

# The back forearm's panel runs on into the hand with no line at the wrist: it stops at the wrist.
LIMITS: dict[str, int] = {"forearms (back)": 612}

# What the supplied Push master paints, so a check can confirm the panels are read correctly.
PUSH = ["front deltoid", "pectorals", "triceps (front)", "rear deltoid", "triceps (back)"]

# Each day's muscles, from the words in client/src/lib/dayFigures.ts.
DAYS: dict[str, list[str]] = {
    # Lats · traps and mid-back · rear delts · biceps
    "pull": ["latissimus dorsi", "trapezius", "upper trapezius (front)", "mid and lower trapezius", "rotator cuff and teres", "rear deltoid", "biceps"],
    # Quads · glutes · hamstrings · calves
    # (Lower trains these too, and Home shows it this figure.)
    "legs": ["quadriceps", "gluteus maximus", "gluteus medius", "hamstrings", "calves (front)", "calves (back)"],
    # Chest · shoulders · arms · upper back · abs
    "upper": ["pectorals", "front deltoid", "rear deltoid", "triceps (front)", "triceps (back)", "biceps", "trapezius", "upper trapezius (front)", "mid and lower trapezius", "rotator cuff and teres", "latissimus dorsi", "rectus abdominis"],
    # Obliques and core · hips · glutes · posterior chain · shoulder stabilisation
    "sport-transfer": ["external obliques (front)", "external obliques (back)", "rectus abdominis", "hip flexors and adductors", "gluteus medius", "gluteus maximus", "erector spinae", "hamstrings", "rotator cuff and teres", "mid and lower trapezius", "serratus anterior"],
    # Chest · back · shoulders · arms · core · legs: every listed muscle but the forearms
    "full-body": [name for name in MUSCLES if not name.startswith("forearms")],
}


def luminance(rgb: np.ndarray) -> np.ndarray:
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def disk(radius: int) -> np.ndarray:
    y, x = np.mgrid[-radius:radius + 1, -radius:radius + 1]
    return x * x + y * y <= radius * radius


class Figure:
    def __init__(self, master: Path = MASTER):
        self.rgba = np.asarray(Image.open(master).convert("RGBA")).astype(float)
        rgb, alpha = self.rgba[..., :3], self.rgba[..., 3]
        self.lum = luminance(rgb)
        self.orange = (rgb[..., 0] > rgb[..., 2] + 50) & (rgb[..., 0] > 120)
        dark = (alpha > 200) & ~self.orange & (self.lum < OUTLINE_LUMINANCE)
        core = (alpha > 200) & ~ndi.binary_dilation(dark, structure=disk(GAP))
        lo, no = ndi.label(core & self.orange)
        ln, _ = ndi.label(core & ~self.orange)
        lab = np.where(lo > 0, lo, np.where(ln > 0, ln + no, 0))
        sizes = np.bincount(lab.ravel())
        lab[sizes[lab] < MIN_PANEL] = 0
        self.core = lab
        # Every visible pixel joins its nearest panel; a panel repaints only its own edge band,
        # never the wider shadows and outlines beyond it.
        distance, (iy, ix) = ndi.distance_transform_edt(lab == 0, return_indices=True)
        self.nearest = (iy, ix)
        self.full = np.where(alpha > 0, lab[iy, ix], 0)
        self.band = (alpha > 0) & (distance <= GAP + EDGE)
        self.panels = {name: self.panels_at(name, points) for name, points in MUSCLES.items()}
        self.ramps()

    def panels_at(self, name: str, points: list[tuple[int, int]]) -> set[int]:
        found = set()
        for x, y in points:
            panel = int(self.core[y, x])
            if not panel:
                raise SystemExit(f"{name}: ({x}, {y}) is not inside a panel of the master")
            found.add(panel)
        return found

    def ramps(self) -> None:
        """Colour as a function of luminance, for the supplied orange and the supplied navy."""
        rgb = self.rgba[..., :3]
        solid = (self.core > 0) & (self.rgba[..., 3] > 250)
        self.orange_ramp = self.ramp(rgb[solid & self.orange], self.lum[solid & self.orange])
        self.navy_ramp = self.ramp(rgb[solid & ~self.orange], self.lum[solid & ~self.orange])
        self.orange_levels = np.sort(self.lum[solid & self.orange])

    @staticmethod
    def ramp(colours: np.ndarray, lums: np.ndarray):
        edges = np.percentile(lums, np.linspace(0.5, 99.5, 40))
        keys, values = [], []
        for low, high in zip(edges[:-1], edges[1:]):
            inside = (lums >= low) & (lums < high)
            if inside.sum() > 20:
                keys.append(lums[inside].mean())
                values.append(colours[inside].mean(axis=0))
        keys, values = np.array(keys), np.array(values)
        return lambda lum: np.stack([np.interp(lum, keys, values[:, c]) for c in range(3)], axis=-1)

    @staticmethod
    def bounds(mask: np.ndarray):
        ys, xs = np.where(mask)
        return slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)

    @staticmethod
    def geometry(core: np.ndarray):
        """Depth into the panel (0 at its edge, 1 at its deepest) and height within it (0 at its
        top), over the given window."""
        depth = ndi.distance_transform_edt(np.pad(core, 1))[1:-1, 1:-1]
        depth = depth / max(depth.max(), 1)
        rows = np.where(core.any(axis=1))[0]
        height = np.clip((np.arange(core.shape[0]) - rows.min()) / max(1, rows.max() - rows.min()), 0, 1)
        return depth, height[:, None] * np.ones((1, core.shape[1]))

    @staticmethod
    def fibres(core: np.ndarray, seed: int) -> np.ndarray:
        """Streaks along the panel's long axis, unit spread, over the given window."""
        ys, xs = np.where(core)
        cov = np.cov(np.vstack([xs, ys]))
        vals, vecs = np.linalg.eigh(cov)
        angle = np.degrees(np.arctan2(vecs[1, 1], vecs[0, 1]))
        h, w = core.shape
        size = int(np.hypot(h, w)) + 8
        noise = np.random.default_rng(seed).standard_normal((size, size))
        streaks = ndi.gaussian_filter(noise, sigma=(1.0, 14.0))
        streaks = ndi.rotate(streaks, angle, reshape=False, order=1)
        top, left = (size - h) // 2, (size - w) // 2
        out = streaks[top:top + h, left:left + w]
        return out / max(out[core].std(), 1e-6)

    def blank(self) -> np.ndarray:
        """The master with Push's orange panels repainted navy."""
        out = self.rgba.copy()
        for name in PUSH:
            for panel in self.panels[name]:
                self.paint(out, panel, navy=True)
        # Orange anti-aliasing left on the silhouette's soft edge takes the outline colour.
        stray = (out[..., 0] > out[..., 2] + 30) & (self.full > 0)
        out[..., :3][stray] = OUTLINE_RGB
        return out

    def paint(self, out: np.ndarray, panel: int, navy: bool = False, seed: int = 0, max_y: int | None = None) -> None:
        owned = (self.full == panel) & self.band
        if max_y is not None:
            owned[max_y + 1:] = False
        box = self.bounds(owned)
        core = (self.core[box] == panel) & owned[box]
        src = self.lum[box]
        fill = np.median(src[core])
        depth, height = self.geometry(core)
        if navy:
            smooth = ndi.gaussian_filter(np.where(core, src, fill), 3)
            target = 66 + 6 - 14 * height + 0.25 * (src - smooth)
            ramp = self.navy_ramp
        else:
            base = -3 + 42 * np.sqrt(depth) - 48 * height + 4 * self.fibres(core, seed)
            # Spread as the supplied orange is spread: rank within the panel, then the orange's levels.
            ranks = np.argsort(np.argsort(base[core]))
            q = (ranks + 0.5) / len(ranks)
            lo, hi = np.percentile(self.orange_levels, [3, 99])
            target = np.zeros_like(base)
            target[core] = np.clip(np.quantile(self.orange_levels, 0.02 + 0.96 * q), lo, hi)
            ramp = self.orange_ramp
        # A rim pixel takes the shade of its nearest core pixel, and mixes with the outline in the
        # proportion the original mixed outline and fill.
        rows, cols = np.where(owned[box])
        gy, gx = rows + box[0].start, cols + box[1].start
        iy, ix = self.nearest
        ny = np.clip(iy[gy, gx] - box[0].start, 0, core.shape[0] - 1)
        nx = np.clip(ix[gy, gx] - box[1].start, 0, core.shape[1] - 1)
        lum = target[ny, nx]
        dark = OUTLINE_LUMINANCE * 0.6
        mix = np.clip((self.lum[gy, gx] - dark) / max(fill - dark, 1), 0, 1)
        mix[core[rows, cols]] = 1.0
        out[gy, gx, :3] = OUTLINE_RGB * (1 - mix[:, None]) + ramp(lum) * mix[:, None]

    def day(self, muscles: list[str], blank: np.ndarray) -> np.ndarray:
        out = blank.copy()
        supplied = {panel for name in PUSH for panel in self.panels[name]}
        # The supplied panels first, exactly as drawn, so a painted neighbour's rim is laid over them.
        for name in muscles:
            for panel in sorted(self.panels[name] & supplied):
                owned = self.full == panel
                out[owned] = self.rgba[owned]
        for name in muscles:
            for panel in sorted(self.panels[name] - supplied):
                self.paint(out, panel, seed=panel, max_y=LIMITS.get(name))
        return out


def derive(splits: list[str] | None = None) -> dict[str, Image.Image]:
    figure = Figure()
    blank = figure.blank()
    out = {}
    for split in splits or list(DAYS):
        if split not in DAYS:
            continue
        pixels = figure.day(DAYS[split], blank)
        out[split] = Image.fromarray(np.clip(np.rint(pixels), 0, 255).astype(np.uint8), "RGBA")
    return out


def region_map(figure: Figure) -> Image.Image:
    """Each named muscle in its own colour over the master, to check the mapping by eye."""
    rng = np.random.default_rng(11)
    canvas = np.zeros(figure.rgba.shape[:2] + (3,))
    canvas[figure.rgba[..., 3] > 0] = (40, 40, 40)
    for name, panels in figure.panels.items():
        colour = rng.integers(80, 255, 3)
        for panel in panels:
            canvas[figure.core == panel] = colour
    return Image.fromarray(canvas.astype(np.uint8), "RGB")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: derive.py <outDir>")
    target = Path(sys.argv[1])
    target.mkdir(parents=True, exist_ok=True)
    figure = Figure()
    region_map(figure).save(target / "regions.png")
    # The check: Push drawn by this method from the blank figure should match the supplied Push.
    blank = figure.blank()
    Image.fromarray(np.clip(np.rint(blank), 0, 255).astype(np.uint8), "RGBA").save(target / "blank.png")
    for split, image in derive().items():
        image.save(target / f"{split}.png")
        print(f"wrote  {split}.png")


if __name__ == "__main__":
    main()
