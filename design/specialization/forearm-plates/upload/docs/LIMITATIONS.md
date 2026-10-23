# Known limitations and requirements

## Scope

This is an educational training visualization, not a clinical, diagnostic, or surgical anatomy atlas. The rendered anatomy plates are derived from separate source meshes and preserve the named training structures, but they do not replace a clinical imaging viewer.

## Data requirements

Sports Genome must supply valid stable IDs and `muscleDataById` entries. The mesh tint uses direct dynamic sets in **Volume** mode and target sets in **Target** mode. Missing values use the low end of the heat scale rather than being invented.

## Runtime requirements

No WebGL, GLB loading, decoder, 3D camera, or animation is required in the browser. The client uses ordinary 2D canvas compositing plus shipped base plate and alpha-mask PNGs. The heat key, focus rail, and grouped picker remain available if a specific image asset cannot load.

## Regeneration requirement

The pre-rendered images are intentionally static anatomy assets. If a mesh name, a muscle’s ownership, a layer assignment, or the source model changes, rerun `scripts/generate_mesh_heatmap_plates.py` with the same separated-mesh source before shipping. The app cannot derive new segmentation from a shaded image alone.

## Anatomy and provenance

Surface/deep assignments are documented with source-backed rationale in `MESH-HEATMAP-ANATOMY-SYNTHESIS.md`. Confirm licensing and attribution requirements for any replacement anatomy model before redistributing regenerated images; see `ATTRIBUTION.md`.
