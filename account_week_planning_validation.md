# Account, Passkey, and Three-Week Planning Validation

The configured Manus account portal exposes a **Continue with a passkey** entry. Gym Optimizer therefore delegates passkey registration and verification to the provider’s secure OAuth portal rather than storing or processing biometric data itself. On compatible devices, the provider can invoke the platform authenticator, such as Face ID; other account methods remain available as a fallback.

The app now opens at a dedicated account-first entry page before the Pulse Quiz. Live browser verification confirmed this gate is the first interactive screen and routes users to the secure account portal. Three-week generation and visibility are covered by focused unit tests; each generated week stores its own day stacks, prescriptions, exercise settings, and imported-plan context in persisted plan snapshots.

Mobile preview verification confirmed that the authenticated preview path still renders the Pulse Quiz cleanly at 390px width, with readable outcome cards and an accessible primary action. The independent browser session, which does not inherit preview authentication, continues to display the account-first entry as the first application surface.
