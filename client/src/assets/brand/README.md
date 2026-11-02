# Bundled brand images

The official header badge and logo, copied byte for byte from the `sports-genome-assets`
storage bucket by `scripts/assets/vendor-brand-assets.mjs`, under their storage names.
`client/src/lib/sportsGenomeAssets.ts` serves them from the app when they are here, and from
the bucket when they are not. Do not edit or re-export them: replace them by re-running the
script, so the artwork stays the owner's own file.
