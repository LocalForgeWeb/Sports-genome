# Activation and Sport Selection Validation

The reset onboarding now opens at the first Pulse Quiz step without using persisted profile state, and the blank sport identifier is guarded before movement recommendation calculations. This prevents the previous startup error and ensures sport selection is only made in the sport-context step.

The anatomy asset has been uploaded to durable web storage and the atlas now uses that deployed path. Atlas visibility is filtered to primary and secondary exercise or movement roles: non-relevant muscle regions no longer have callouts, hotspots, or colored activation overlays. The underlying illustration is deliberately muted so low or unrelated anatomy no longer reads as active engagement.

The live sport-context step displayed all twenty sports with no active sport card. Selecting Boxing activated only the Boxing card, confirming that Tennis no longer preloads and the selection can be changed intentionally.

After Boxing was selected, the Continue control reported as enabled in the live interface and advanced the quiz to the scheduling step.

The selected Boxing profile completed the onboarding and entered a Boxing recommendation workspace. A direct Sport selector is visible in the workspace header alongside the twenty sports, providing sport changes without restarting the plan.

In the live Body Lab for a Boxing jab, the durable anatomy illustration rendered correctly. The board displayed only the relevant upper-body, trunk, and kinetic-chain callouts; unrelated quadriceps, hamstrings, calves, and lower-leg callouts were absent.

The header selector successfully switched the live Body Lab from Boxing to Soccer without rerunning onboarding. The selected Soccer acceleration profile then displayed only relevant lower-body and trunk callouts, including quadriceps femoris, gluteus maximus, hamstrings, gastrocnemius, hip adductors, and rectus abdominis.
