import { trpc } from "@/lib/trpc";
import { dismissBootSplash } from "@/lib/bootSplash";
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

/**
 * The boot screen is fixed, opaque, and sits at the top of the stacking order until
 * React adds `sports-genome-app-ready`. Anything that stops React from getting there
 * leaves the athlete staring at a finished animation over a working app they cannot
 * reach, so every failure path below has to end in either a mounted app or a visible
 * explanation - never a silent rejection.
 */
function renderStartupFailure(root: HTMLElement, error: unknown) {
  dismissBootSplash({ immediate: true });
  const detail = error instanceof Error ? error.message : "The application could not be loaded.";
  root.innerHTML = "";

  const panel = document.createElement("div");
  panel.setAttribute("role", "alert");
  panel.style.cssText =
    "min-height:100dvh;display:grid;place-items:center;padding:24px;background:#07182e;color:#f7f4ec;font:500 15px/1.5 system-ui,sans-serif;text-align:center";

  const inner = document.createElement("div");
  inner.style.cssText = "max-width:34rem;display:grid;gap:14px;justify-items:center";

  const heading = document.createElement("h1");
  heading.textContent = "Sports Genome could not start";
  heading.style.cssText = "margin:0;font:800 24px/1.1 system-ui,sans-serif;text-transform:uppercase";

  const body = document.createElement("p");
  body.textContent = "Reloading usually fixes this. If it keeps happening, your connection may be blocking part of the app.";
  body.style.cssText = "margin:0;color:#c4d4e4";

  const technical = document.createElement("p");
  technical.textContent = detail;
  technical.style.cssText = "margin:0;color:#8ea6c0;font:400 12px/1.5 ui-monospace,monospace;word-break:break-word";

  const reload = document.createElement("button");
  reload.type = "button";
  reload.textContent = "Reload";
  reload.style.cssText =
    "min-height:44px;padding:0 20px;border:0;border-radius:10px;background:#e4512e;color:#fff;font:800 13px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer";
  reload.addEventListener("click", () => window.location.reload());

  inner.append(heading, body, technical, reload);
  panel.append(inner);
  root.append(panel);
}

/**
 * Loads the workspace chunk, retrying once. A rejection here is most often a stale
 * chunk reference after a deploy: the loaded document points at hashed files that no
 * longer exist, and a second attempt picks up the new manifest when that is all it was.
 */
async function loadApp() {
  try {
    const { default: App } = await import("./App");
    return App;
  } catch (firstError) {
    console.warn("[Startup] workspace chunk failed to load; retrying once", firstError);
    const { default: App } = await import("./App");
    return App;
  }
}

async function mountWorkspace() {
  const root = document.getElementById("root");
  if (!root) return;

  let App: Awaited<ReturnType<typeof loadApp>>;
  try {
    App = await loadApp();
  } catch (error) {
    console.error("[Startup] workspace chunk could not be loaded", error);
    renderStartupFailure(root, error);
    return;
  }

  try {
    createRoot(root).render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    );
  } catch (error) {
    console.error("[Startup] workspace failed to mount", error);
    renderStartupFailure(root, error);
  }
}

/**
 * The heavy workspace import stays deferred until the intro reaches its held final
 * frame, so evaluating it cannot stutter the video. The failure paths above are what
 * changed: a rejection here used to disappear, leaving the boot screen up for good.
 */
const documentBootStartedAt = Number(document.documentElement.dataset.sportsGenomeBootStartedAt);
const elapsedBootMs = Number.isFinite(documentBootStartedAt) ? Math.max(0, Date.now() - documentBootStartedAt) : 0;
/**
 * The deferral exists so evaluating the workspace chunk cannot stutter the intro
 * video. A returning launch does not play that video, so there is nothing to protect
 * and nothing to wait for - the chunk is already preloaded by then, so mounting is
 * close to immediate.
 */
const returningLaunch = document.documentElement.dataset.sportsGenomeBootReturn === "yes";
const workspaceMountDelayMs = returningLaunch ? 0 : Math.max(0, 1_580 - elapsedBootMs);
window.setTimeout(() => { void mountWorkspace(); }, workspaceMountDelayMs);
