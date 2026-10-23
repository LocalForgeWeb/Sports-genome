# Mesh plate provenance and licensing boundary

The runtime plates and alpha masks in `public/assets/anatomy/mesh-plates/` are deterministic offline renders from a separately named upper-limb anatomy GLB used during this project’s production workflow. The generator is retained as `scripts/generate_mesh_heatmap_plates.py`; it is not loaded by the browser.

The anatomy source used for production is the Open3Dmodel upper-limb asset obtained through the project’s documented source workflow: `https://caskanatomy.info/open3dmodelfiles/upper-limb/upper-limb-glb.zip`. The shipped browser bundle contains rendered plates and masks, not a live GLB, Blender, Three.js, or a decoder.

Before distributing regenerated imagery or substituting another anatomy source, confirm that source’s current model-license, attribution, and redistribution requirements. The source URL, model mapping rationale, and clinical layer assignments are documented in `MESH-HEATMAP-ANATOMY-SYNTHESIS.md`.

All heat colors, fitness values, host copy, selection state, and ordinary interface elements are original application behavior. They are never baked into the anatomical plate images.
