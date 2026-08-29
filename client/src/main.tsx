import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import "./index.css";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
      },
    }),
  ],
});

async function mountWorkspace() {
  const { default: App } = await import("./App");
  createRoot(document.getElementById("root")!).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const documentBootStartedAt = Number(document.documentElement.dataset.sportsGenomeBootStartedAt);
const elapsedBootMs = Number.isFinite(documentBootStartedAt) ? Math.max(0, Date.now() - documentBootStartedAt) : 0;
const workspaceMountDelayMs = Math.max(0, 1_580 - elapsedBootMs);
window.setTimeout(() => { void mountWorkspace(); }, workspaceMountDelayMs);
