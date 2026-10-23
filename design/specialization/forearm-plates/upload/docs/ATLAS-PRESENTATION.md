# Model-derived forearm heatmap presentation

## Purpose

This front/back forearm heatmap is a connected anatomy surface for Sports Genome. It uses deterministic orthographic renders of separately named muscle meshes, not a decorative image or an approximate SVG trace. The browser adds training-volume tint only through the alpha mask belonging to each actual rendered muscle.

## Visual system

- Deep navy presentation field with three shaded, hand-to-elbow anatomical plates: **front / palmar**, **back / dorsal**, and **side / thumb**.
- Low-to-high host volume maps from blue-gray through amber to Sports Genome orange `#F15A32`.
- The underlying mesh render remains visible below the tint, preserving volume, texture, and lighting.
- A selected muscle receives a stronger but still translucent tint and glow. It is the original rendered mesh surface, never a duplicate or a mirrored shape.
- The active deep layer uses its own plate render rather than pretending that deep and superficial anatomy are simultaneously exposed.

## Exact connection model

Each plate is paired with transparent mask PNGs. The browser uses every mask twice:

1. Composite color only inside that mesh’s alpha boundary.
2. Read alpha at the pointer location to map a click/tap back to that same stable muscle ID.

The heat key, focus rail, grouped list, canvas selection, host programmatic selection, and information panel all use the same stable IDs.

## Layer treatment

- **Palmar surface/intermediate**: Brachioradialis, FDS, FCU, FCR, Palmaris longus, and Pronator teres.
- **Palmar deep**: FDP, FPL, Pronator quadratus.
- **Dorsal surface**: Brachioradialis, Anconeus, ECRL, ECRB, ED, EDM, ECU.
- **Dorsal deep**: Supinator, APL, EPB, EPL, Extensor indicis.
- **Thumb-side surface**: Brachioradialis, FCR, ECRL, ECRB.
- **Thumb-side deep**: Supinator, FPL, APL, EPB, EPL.

The layer assignments follow the references listed in `MESH-HEATMAP-ANATOMY-SYNTHESIS.md`. The component switches the local plate layer for a deep host selection; it does not modify host selection or create a feedback loop.

## Accessibility and fallbacks

The exact canvas is click/tap interactive. The heat key, focus rail, and grouped list remain semantic button alternatives for keyboard and non-canvas interaction. If an asset fails to load, its plate reports a clear local error while the structured heat key and selection panel remain usable.
