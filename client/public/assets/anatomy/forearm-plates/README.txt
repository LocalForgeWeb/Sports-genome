Rendered forearm plates, the Drawing of Body Lab -> Specialize -> Forearms (23 Oct 2026).

Six passes (anterior, posterior and lateral; each at surface and deep), each a plate and a label
image, all 246 x 752 px:
  <pass>.webp         the shaded render, cropped, transparent background, WebP quality 80
  <pass>.labels.png   8-bit greyscale; pixel value = muscle index (1-based, in the order of
                      shared/specialization/regions/forearm/plates.generated.ts), 0 = none
Checksums: SHA256SUMS.txt (checked by client/src/lib/specialization/forearmPlates.test.ts).

Made by design/specialization/forearm-plates/build_plates.py from the owner's mesh-plate package
(design/specialization/forearm-plates/upload/; its 12.6 MB originals are not kept here, their
SHA-256 sums are in plates.generated.ts).

Adapted renders of third-party work, not made by Sports Genome:
  Open3Dmodel upper-limb model    https://anatomytool.org/open3dmodel-create
  built on BodyParts3D, The Database Center for Life Science - CC BY-SA 2.1 Japan
                                  https://lifesciencedb.jp/bp3d/?lng=en
  and Z-Anatomy, the libre 3D atlas of anatomy - CC BY-SA 4.0
                                  https://github.com/Z-Anatomy/Models-of-human-anatomy
Changes: rendered to still images in Blender (the package's generator), cropped, background made
transparent, re-encoded, and each pixel assigned to the muscle the render shows there. In the app
the muscles are tinted by the athlete's training. These images are shared under CC BY-SA 4.0.

For education, not diagnosis or treatment. Attribution and limits:
docs/specialization-atlas/08-diagram.md, "Plates".
