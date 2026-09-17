/**
 * Starts the workspace download while the intro is still playing.
 *
 * main.tsx deliberately waits ~1.6s before importing ./App, so that evaluating a
 * large chunk cannot stutter the intro video. That deferral is right, but it was
 * also deferring the *download*: nothing fetched App until the timer fired, so on a
 * slow connection the athlete watched the intro finish and then waited again for
 * several hundred kilobytes.
 *
 * A modulepreload separates the two. The browser fetches and parses the chunk off
 * the critical path during the animation, and main.tsx still evaluates it on its own
 * schedule - so the intro now covers real work instead of preceding it.
 *
 * The filename is content-hashed, so the tag has to be written from the finished
 * bundle rather than hardcoded.
 */

type EmittedChunk = { type: string; isEntry?: boolean; fileName: string; name?: string };

/** The chunk main.tsx reaches for, identified by rollup's own name for it. */
export function findWorkspaceChunk(bundle: Record<string, EmittedChunk>): string | null {
  for (const chunk of Object.values(bundle)) {
    if (chunk.type !== "chunk" || chunk.isEntry) continue;
    if (chunk.name === "App") return chunk.fileName;
  }
  return null;
}

export function preloadWorkspaceChunkPlugin() {
  return {
    name: "sports-genome-preload-workspace-chunk",
    // `post` so the bundle is complete and the hashed name is final.
    transformIndexHtml: {
      order: "post" as const,
      handler(html: string, ctx: { bundle?: Record<string, EmittedChunk> }) {
        if (!ctx.bundle) return html;
        const fileName = findWorkspaceChunk(ctx.bundle);
        if (!fileName) return html;
        return {
          html,
          tags: [
            {
              tag: "link",
              attrs: { rel: "modulepreload", crossorigin: true, href: `/${fileName}` },
              injectTo: "head" as const,
            },
          ],
        };
      },
    },
  };
}
