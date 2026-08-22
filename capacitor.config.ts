import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the built web bundle in a native iOS shell.
 *
 * `webDir` points at Vite's client output (see `build.outDir` in vite.config.ts).
 * Only the client is bundled into the app — the Express/tRPC server stays
 * deployed and is reached over the network via `VITE_API_BASE_URL`.
 *
 * `appId` is the iOS bundle identifier. Change it to whatever you register in
 * App Store Connect BEFORE running `npx cap add ios`; changing it afterwards
 * means editing the generated Xcode project too.
 */
const config: CapacitorConfig = {
  appId: "ai.monkeypants.sportsgenome",
  appName: "Sports Genome",
  webDir: "dist/public",
  ios: {
    // Let the webview extend under the status bar so `viewport-fit=cover` and
    // the safe-area CSS control the insets, rather than iOS reserving them.
    contentInset: "never",
    // Swipe back/forward would navigate the SPA's history in ways the UI does
    // not expect; the app has its own navigation.
    allowsLinkPreview: false,
  },
  server: {
    // Serves the bundle from capacitor://localhost. This value must stay in sync
    // with the allowed origins in server/_core/cors.ts.
    iosScheme: "capacitor",
  },
  plugins: {
    Keyboard: {
      // Resize the webview, not the document, so fixed bottom docks stay put.
      resize: "native",
    },
  },
};

export default config;
