/**
 * The 3D model's credits (SG-FOREARM-INTEGRATION-20261019 §9), shown wherever the model is.
 * The model is third-party work, credited as its sources ask; Sports Genome made the
 * integration, not the model. The full record is docs/specialization-atlas/forearm-3d/.
 */
export function AnatomyModelCredits() {
  return <>
    <p>The 3D forearm is the Open3Dmodel upper-limb model (<a href="https://anatomytool.org/open3dmodel-create" target="_blank" rel="noreferrer">anatomytool.org</a>), built on BodyParts3D, The Database Center for Life Science (CC BY-SA 2.1 Japan), and Z-Anatomy, the libre 3D atlas of anatomy (CC BY-SA 4.0). Its viewer code (<a href="https://github.com/djansma/open3dviewer" target="_blank" rel="noreferrer">open3dviewer</a>) is GPL-3.0.</p>
    {/* One model, never mirrored, and no side named: both arms count as one (owner, 20 Oct 2026). */}
    <p>It is one model of one arm, never mirrored. Deep muscles are shown through the faded muscles above them. The model is for education, not diagnosis or treatment, and real anatomy varies.</p>
  </>;
}
