import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";
import { apiUrl } from "./lib/apiBase";
import { authHeaders, loadAuthToken } from "./lib/authToken";
import { registerNativeAuthListener } from "./lib/nativeAuth";
import { initNativeShell } from "./lib/nativeShell";
import { isNativePlatform } from "./lib/platform";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // Relative on web (same-origin, cookie-authenticated); absolute against
      // VITE_API_BASE_URL in the iOS app, whose bundle is served from
      // capacitor://localhost and has no API of its own. See lib/apiBase.ts.
      url: apiUrl("/api/trpc"),
      transformer: superjson,
      headers() {
        // Native: the stored bearer token is the entire session.
        // Web: usually empty — the httpOnly cookie authenticates the request,
        // and this only carries the sessionStorage mirror used when a browser
        // blocks iframe cookies (Safari ITP, private browsing, WebView).
        // Either way the server prefers the cookie. See lib/authToken.ts.
        return authHeaders();
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

async function bootstrap() {
  // Hydrate the stored token BEFORE the first render. Native reads it from
  // persistent storage asynchronously, and a render that beats it would fire an
  // unauthenticated `auth.me`, land in the 401 handler above, and bounce the
  // user into a login they had already completed.
  await loadAuthToken();

  if (isNativePlatform()) {
    await initNativeShell();
    await registerNativeAuthListener(() => {
      // The deep link arrives long after the failed queries; refetch everything
      // so the UI lands logged in without a manual reload.
      void queryClient.invalidateQueries();
    });
  }

  createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

void bootstrap();
