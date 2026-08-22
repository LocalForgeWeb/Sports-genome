import { DEFAULT_NATIVE_APP_SCHEME } from "@shared/const";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Custom URL scheme the iOS app registers. The OAuth callback redirects the
  // session token here, so it is read from the environment and never from the
  // request — a crafted `state` must not be able to aim a token at someone
  // else's app.
  nativeAppScheme: process.env.NATIVE_APP_SCHEME ?? DEFAULT_NATIVE_APP_SCHEME,
  // Extra browser origins allowed to call the API with credentials, comma
  // separated. The native webview origins are always allowed; this is for
  // additional web deployments.
  extraAllowedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean),
};
