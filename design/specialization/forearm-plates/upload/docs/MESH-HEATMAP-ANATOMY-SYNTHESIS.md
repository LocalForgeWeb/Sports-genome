# Mesh-backed forearm heatmap anatomy synthesis

The interactive front/back heatmap will be rendered from a verified anatomical GLB with separately named meshes. The plate is not a traced bitmap: each color layer and pointer target is derived from the actual mesh or meshes in `muscleManifest.ts`.

## Render layer decisions

The **anterior surface** pass contains the superficial flexor/pronator group: flexor carpi ulnaris, palmaris longus, flexor carpi radialis, pronator teres, and brachioradialis as lateral context. Flexor digitorum superficialis is rendered as its own intermediate target. The **anterior deep** pass contains flexor digitorum profundus, flexor pollicis longus, and pronator quadratus.

The **posterior surface** pass contains extensor carpi radialis longus and brevis, extensor digitorum, extensor digiti minimi, extensor carpi ulnaris, anconeus, and brachioradialis where visible. The **posterior deep** pass contains supinator, abductor pollicis longus, extensor pollicis brevis, extensor pollicis longus, and extensor indicis.

The **thumb-side surface** pass isolates the radial contour: brachioradialis, flexor carpi radialis, extensor carpi radialis longus, and extensor carpi radialis brevis. The **thumb-side deep** pass uses the same lateral camera direction to surface supinator, flexor pollicis longus, abductor pollicis longus, extensor pollicis brevis, and extensor pollicis longus.

This view/layer assignment follows the clinically meaningful compartment organization rather than trying to display every depth simultaneously. The app switches to the relevant surface/deep pass when the host selects an ID, then composites an exact alpha mask for that ID over the shaded model render. The same alpha data performs canvas hit-testing.

## Evidence

TeachMeAnatomy describes the anterior compartment as superficial (flexor carpi ulnaris, palmaris longus, flexor carpi radialis, pronator teres), intermediate (flexor digitorum superficialis), and deep (flexor pollicis longus, flexor digitorum profundus, pronator quadratus). [1]

The posterior reference distinguishes a superficial extensor group including the radial wrist extensors, extensor digitorum, extensor digiti minimi, extensor carpi ulnaris and anconeus, and a deep group of supinator, abductor pollicis longus, extensor pollicis brevis/longus and extensor indicis. [2]

The user-supplied anterior/posterior diagrams were used as visual cross-checks for the intended hand-to-elbow framing and tendon visibility. They are not used as the heatmap substrate.

## References

[1]: https://teachmeanatomy.info/upper-limb/muscles/anterior-forearm/ "Anterior Forearm Flexor Muscles"

[2]: https://teachmeanatomy.info/upper-limb/muscles/posterior-forearm/ "Posterior Forearm Extensor Muscles"
