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
     streaks along the panel's long axis, and the artist's own shading of the navy panel carried
     through), mapped through the supplied orange's own colours. The outline is kept: an edge
     pixel mixes the outline colour and the new fill in the proportion the original mixed outline
     and navy, weighted towards the outline so the edge stays crisp. A faint stroke inside a panel
     darkens the orange instead of cutting it, and a few-pixel navy speck left where outlines meet
     takes the outline colour.

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
MASTER_WIDTH = 1254

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
    "serratus anterior": [(286, 454), (441, 454), (257, 392), (472, 392), (256, 415), (472, 415)],
    # The narrow strip down the side of the torso from the armpit, outside the serratus.
    "latissimus dorsi (front)": [(240, 406), (487, 407)],
    "external obliques (front)": [(286, 527), (449, 527)],
    # The tensor fasciae latae on the outer hip and the long adductor strips of the inner thigh.
    # The four slivers at the groin are in deep shadow and too small to paint cleanly.
    "hip flexors and adductors": [(259, 580), (475, 580), (328, 667), (348, 694), (407, 667), (387, 705)],
    "quadriceps": [(283, 676), (241, 714), (309, 768), (451, 676), (493, 714), (425, 768)],
    "calves (front)": [(223, 937), (295, 938), (271, 1027), (510, 936), (439, 938), (462, 1027)],
    # Back figure
    # Both halves and the small pieces at the shoulder; the groove at the nape between them stays a recess.
    "trapezius": [(861, 251), (923, 251), (810, 255), (981, 255)],
    "lower trapezius": [(860, 364), (931, 364)],
    "rear deltoid": [(745, 285), (1045, 285)],
    # Infraspinatus and teres over the shoulder blade, and the teres lens under the rear deltoid
    # that Push leaves navy (neither deltoid nor triceps).
    "rotator cuff and teres": [(828, 300), (963, 300), (798, 300), (993, 300), (795, 339), (996, 339), (739, 325), (1048, 325)],
    "latissimus dorsi": [(820, 420), (971, 420)],
    "erector spinae": [(872, 500), (917, 500)],
    "external obliques (back)": [(815, 504), (982, 505)],
    "triceps (back)": [(722, 402), (1069, 403)],
    "forearms (back)": [(669, 486), (685, 580), (1124, 487), (1114, 583)],
    "gluteus medius": [(801, 567), (991, 566)],
    "gluteus maximus": [(845, 611), (951, 611)],
    # The outer thigh from behind: vastus lateralis under the iliotibial band.
    "quadriceps (back)": [(769, 707), (1015, 706)],
    "hamstrings": [(799, 754), (835, 790), (859, 729), (802, 821), (995, 754), (959, 790), (934, 729), (991, 822)],
    "calves (back)": [(773, 921), (816, 925), (782, 1036), (754, 1010), (790, 1061), (976, 934), (1017, 915), (1010, 1036), (1038, 1010), (990, 1040)],
}

# The back forearm's panel runs on into the hand: it stops at the wrist, fading over FADE px.
LIMITS: dict[str, int] = {"forearms (back)": 612}
FADE = 6
# A calf panel that narrows into the Achilles or an ankle tendon (runs on TAPER_TAIL px or more
# past where it is half as wide as at its widest) stops there, fading over TAPER_FADE px. A
# teardrop head that ends at its own outline is left whole.
TAPERED = {"calves (back)", "calves (front)"}
TAPER_WIDTH = 0.5
TAPER_TAIL = 20
TAPER_FADE = 28

# Fibre direction where the panel's long axis is not it, for the figure's left-hand panels
# (mirrored on the right): the trapezius runs from the spine out to the shoulder, the gluteus
# maximus down and out from the sacrum, the rectus abdominis and erectors straight up and down.
FIBRES: dict[str, tuple[float, float]] = {"trapezius": (-1.0, 0.45), "gluteus maximus": (-0.82, 0.57), "rectus abdominis": (0.0, 1.0), "erector spinae": (0.0, 1.0)}
# Each figure's midline on the master, for mirroring.
MIDLINES = (363, 892)

# What the supplied Push master paints: these panels keep the supplied pixels on any day that shows
# them, and the blank figure repaints them navy.
PUSH = ["front deltoid", "pectorals", "triceps (front)", "rear deltoid", "triceps (back)"]

# Each day's muscles, from the words in client/src/lib/dayFigures.ts.
DAYS: dict[str, list[str]] = {
    # Lats · traps and mid-back · rear delts · biceps
    "pull": ["latissimus dorsi", "latissimus dorsi (front)", "trapezius", "upper trapezius (front)", "lower trapezius", "rotator cuff and teres", "rear deltoid", "biceps"],
    # Quads · glutes · hamstrings · calves
    # (Lower trains these too, and Home shows it this figure.)
    "legs": ["quadriceps", "quadriceps (back)", "gluteus maximus", "gluteus medius", "hamstrings", "calves (front)", "calves (back)"],
    # Chest · shoulders · arms · upper back · abs
    "upper": ["pectorals", "front deltoid", "rear deltoid", "triceps (front)", "triceps (back)", "biceps", "trapezius", "upper trapezius (front)", "lower trapezius", "rotator cuff and teres", "latissimus dorsi", "latissimus dorsi (front)", "rectus abdominis"],
    # Obliques and core · hips · glutes · posterior chain · shoulder stabilisation
    "sport-transfer": ["external obliques (front)", "external obliques (back)", "rectus abdominis", "hip flexors and adductors", "gluteus medius", "gluteus maximus", "erector spinae", "hamstrings", "rotator cuff and teres", "lower trapezius", "serratus anterior"],
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
        self.supplied = {panel for name in PUSH for panel in self.panels[name]}
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
    def fibres(core: np.ndarray, seed: int, direction: tuple[float, float] | None = None) -> np.ndarray:
        """Fine streaks along the panel's long axis (or the given direction), unit spread, over the
        given window."""
        if direction is None:
            ys, xs = np.where(core)
            vals, vecs = np.linalg.eigh(np.cov(np.vstack([xs, ys])))
            direction = (vecs[0, 1], vecs[1, 1])
        angle = np.degrees(np.arctan2(direction[1], direction[0]))
        h, w = core.shape
        size = int(np.hypot(h, w)) + 8
        noise = np.random.default_rng(seed).standard_normal((size, size))
        streaks = ndi.gaussian_filter(noise, sigma=(0.7, 10.0))
        # The angle is measured with y pointing down; ndi.rotate turns counter-clockwise on screen.
        streaks = ndi.rotate(streaks, -angle, reshape=False, order=1)
        top, left = (size - h) // 2, (size - w) // 2
        out = streaks[top:top + h, left:left + w]
        return out / max(out[core].std(), 1e-6)

    def blank(self) -> np.ndarray:
        """The master with Push's orange panels repainted navy."""
        out = self.rgba.copy()
        for name in PUSH:
            for panel in self.panels[name]:
                self.paint(out, panel, navy=True)
        # Warm anti-aliasing left around Push's panels: on an outline or the silhouette's soft edge
        # it takes the outline colour; between two panels (the front triceps and biceps, where
        # there was no line) it takes a shaded navy, so no dotted seam is left.
        near = ndi.binary_dilation(np.isin(self.full, list(self.supplied)), structure=disk(4))
        stray = near & (out[..., 0] > out[..., 2] + 3) & (self.full > 0)
        edge = stray & ((self.rgba[..., 3] < 250) | (self.lum < 45))
        out[..., :3][edge] = OUTLINE_RGB
        out[..., :3][stray & ~edge] = self.navy_ramp(np.full((stray & ~edge).sum(), 52.0))
        return out

    def paint(self, out: np.ndarray, panel: int, navy: bool = False, seed: int = 0, max_y: int | None = None, fade: int = FADE, direction: tuple[float, float] | None = None, beside_supplied: np.ndarray | None = None) -> None:
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
            target = 66 + 6 - 14 * height + 6 * (np.sqrt(depth) - 0.5) + 0.25 * (src - smooth)
            ramp = self.navy_ramp
        else:
            # The artist's own shading of the navy panel carries through, so a shadow (under the
            # glutes, behind the knee) stays a shadow.
            smooth = ndi.gaussian_filter(np.where(core, src, fill), 4)
            drawn = 1.2 * (smooth - fill) + 0.6 * (src - smooth)
            base = -3 + 42 * np.sqrt(depth) - 48 * height + drawn + 2.5 * self.fibres(core, seed, direction)
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
        keep = None
        if max_y is not None:
            # Over the last `fade` rows the orange deepens and then gives way to what was there.
            keep = np.clip((max_y - gy) / fade, 0, 1)
            lum = lum * (0.7 + 0.3 * keep)
        dark = OUTLINE_LUMINANCE * 0.6
        mix = np.clip((self.lum[gy, gx] - dark) / max(fill - dark, 1), 0, 1)
        rim = ~core[rows, cols]
        # Weighted towards the outline, so a rim reads as a crisp dark edge rather than a brown fringe.
        mix = mix ** 1.6
        mix[~rim] = 1.0
        if not navy:
            # A faint stroke inside the panel (no other panel or background within 9 px, more
            # than a drawn line between two panels is wide) is the artist's shading, not a
            # boundary: it darkens the orange rather than cutting it.
            reach = 9
            window = (slice(max(box[0].start - reach, 0), box[0].stop + reach), slice(max(box[1].start - reach, 0), box[1].stop + reach))
            other = ((self.core[window] > 0) & (self.core[window] != panel)) | (self.rgba[window][..., 3] == 0)
            other = ndi.binary_dilation(other, structure=disk(reach))
            stroke = rim & ~other[gy - window[0].start, gx - window[1].start] & (self.lum[gy, gx] >= 24)
            mix[stroke] = np.maximum(mix[stroke], 0.6)
        if navy:
            painted = OUTLINE_RGB * (1 - mix[:, None]) + ramp(lum) * mix[:, None]
        else:
            # Towards the outline the orange deepens to red before it meets the line, as the
            # supplied panels' edges do, rather than greying through a straight mix.
            painted = OUTLINE_RGB * (1 - mix[:, None]) + ramp(lum * (0.55 + 0.45 * mix)) * mix[:, None]
        if not navy:
            # Where the original drew no line, only Push's orange meeting navy (the front triceps
            # and biceps): beside a supplied panel shown today the seam is the supplied pixels, as
            # drawn; beside a navy one it stays the blank figure's.
            src_rgb = self.rgba[gy, gx, :3]
            seam = rim & (src_rgb[:, 0] > src_rgb[:, 2] + 10)
            if beside_supplied is not None:
                # Both sides orange, and no line drawn between them: the fill runs on up to the
                # supplied panel, as Push's own orange panels meet.
                shown = rim & beside_supplied[gy, gx] & (self.lum[gy, gx] >= 30)
                painted[shown] = ramp(lum[shown])
                seam &= ~beside_supplied[gy, gx]
            painted[seam] = out[gy[seam], gx[seam], :3]
        if keep is not None:
            painted = out[gy, gx, :3] * (1 - keep[:, None]) + painted * keep[:, None]
        out[gy, gx, :3] = painted

    def day(self, muscles: list[str], blank: np.ndarray) -> np.ndarray:
        out = blank.copy()
        supplied = self.supplied
        shown = {panel for name in muscles for panel in self.panels[name] & supplied}
        beside_supplied = ndi.binary_dilation(np.isin(self.full, list(shown)), structure=disk(3)) if shown else None
        # The supplied panels first, exactly as drawn, so a painted neighbour's rim is laid over them.
        for name in muscles:
            for panel in sorted(self.panels[name] & supplied):
                owned = self.full == panel
                out[owned] = self.rgba[owned]
        painted_cores = np.zeros(self.core.shape, bool)
        for name in muscles:
            for panel in sorted(self.panels[name] - supplied):
                painted_cores |= self.core == panel
                end = LIMITS.get(name)
                fade = FADE
                if name in TAPERED:
                    end, fade = self.taper(panel), TAPER_FADE
                self.paint(out, panel, seed=panel, max_y=end, fade=fade, direction=self.direction(name, panel), beside_supplied=beside_supplied)
        if shown:
            self.join(out, shown, painted_cores)
        return self.clean(out)

    def join(self, out: np.ndarray, shown: set[int], painted_cores: np.ndarray) -> None:
        """A supplied panel's edge that faded from orange to navy where the artist drew no line
        (the front triceps beside the biceps) is filled from the orange around it once the
        neighbour is painted too, so the two meet without a dotted seam."""
        edge = np.isin(self.full, list(shown)) & ndi.binary_dilation(painted_cores, structure=disk(3))
        rgb = out[..., :3]
        edge &= (self.lum >= 30) & ~(rgb[..., 0] > rgb[..., 2] + 120)
        if not edge.any():
            return
        solid = (rgb[..., 0] > rgb[..., 2] + 120) & ~edge
        weight = ndi.gaussian_filter(solid.astype(float), 2)
        for c in range(3):
            smooth = ndi.gaussian_filter(np.where(solid, rgb[..., c], 0.0), 2)
            rgb[..., c][edge & (weight > 0.05)] = (smooth / np.maximum(weight, 1e-6))[edge & (weight > 0.05)]

    def taper(self, panel: int) -> int | None:
        """Where a tapered panel's paint ends: TAPER_FADE rows past the row where, below its widest
        row, it first narrows to TAPER_WIDTH of that width. None if it ends at its own outline."""
        widths = (self.core == panel).sum(axis=1)
        rows = np.where(widths > 0)[0]
        widest = rows[np.argmax(widths[rows])]
        narrow = [row for row in rows if row > widest and widths[row] < TAPER_WIDTH * widths[widest]]
        if not narrow or rows.max() - narrow[0] < TAPER_TAIL:
            return None
        return int(narrow[0]) + TAPER_FADE

    def direction(self, name: str, panel: int) -> tuple[float, float] | None:
        if name not in FIBRES:
            return None
        dx, dy = FIBRES[name]
        x = np.where(self.core == panel)[1].mean()
        midline = MIDLINES[0] if x < MASTER_WIDTH / 2 else MIDLINES[1]
        return (dx if x < midline else -dx, dy)

    @staticmethod
    def clean(out: np.ndarray) -> np.ndarray:
        """Navy specks of a few pixels left where three outlines meet inside orange take the
        outline colour."""
        rgb = out[..., :3]
        lum = luminance(rgb)
        navy = (rgb[..., 2] > rgb[..., 0] + 10) & (lum > 35) & (out[..., 3] > 200)
        orange = rgb[..., 0] > rgb[..., 2] + 50
        specks, count = ndi.label(navy)
        sizes = np.bincount(specks.ravel())
        for speck in np.where(sizes[1:] <= 20)[0] + 1:
            mask = specks == speck
            ring = ndi.binary_dilation(mask, iterations=2) & ~mask & (out[..., 3] > 200)
            if ring.any() and orange[ring].mean() >= 0.3 and navy[ring].mean() < 0.2:
                rgb[mask] = OUTLINE_RGB
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
