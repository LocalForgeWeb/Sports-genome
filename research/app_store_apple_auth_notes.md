# Native App Store and Apple Account Access Notes

## Sources reviewed

| Source | Relevant implementation note |
|---|---|
| [Apple: Configuring your environment for Sign in with Apple](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple) | Apple web-service access requires a Sign in with Apple-enabled App ID, an associated Services ID, registered domains and return URLs, and a private key for developer-token signing. Private Email Relay requires registered outbound email sources. |
| [Apple: Submitting to the App Store](https://developer.apple.com/app-store/submitting/) | App Store Connect submission needs product-page metadata, privacy details, and device testing. Apple states that, as of April 28, 2026, iOS/iPadOS uploads need the iOS/iPadOS 26 SDK or later. |
| [Expo: AppleAuthentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) | `expo-apple-authentication` provides native iOS Sign in with Apple. Expo configuration uses `ios.usesAppleSignIn: true` and the `expo-apple-authentication` config plugin. The identity token must be verified server-side using Apple public keys; real-device testing is recommended. |

## Product boundary

Sports Genome’s native app should share the current server, user account record, workout history, catalog, and planning engine. Apple identity tokens must be validated by the server before associating an Apple account identifier with an athlete account. The mobile binary must never include a third-party API secret or Apple private signing key.
