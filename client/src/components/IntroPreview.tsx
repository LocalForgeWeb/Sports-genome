import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { introVideoUrl } from "@/lib/bootExperience";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

/**
 * The intro, watched again from About Me, without relaunching the app.
 *
 * The preview used to reload the document with a replay flag, so the whole
 * boot sequence ran a second time: a second launch, the page's scroll offset
 * restored under a screen that was still being built, and About Me handed back
 * half drawn. This is the same media in the same composition as the boot
 * screen (the video letterboxed on the navy surface, the wordmark over its
 * lower part), on a surface of its own that sits over About Me and leaves it
 * exactly where it was. Close is always in reach - during loading, during
 * playback and during the end card - and Escape does the same. The clip's
 * natural end closes the preview after a short beat; a skip or close happens
 * at most once, and replaying starts from the first frame because each
 * opening is a fresh element.
 */
export function IntroPreview({ onClose, returnTo = null }: { onClose: () => void; /** The control that opened the preview; focus goes back to it on close. A tap does not focus a button, so the opener is named rather than read from `document.activeElement`. */ returnTo?: HTMLElement | null }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"loading" | "playing" | "ended" | "failed">("loading");
  const closedRef = useRef(false);
  const close = () => { if (closedRef.current) return; closedRef.current = true; onClose(); };

  useEffect(() => {
    const opener = returnTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    closeRef.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); close(); } };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      html.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // The opener and the scroll lock belong to this one presentation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The natural end closes the preview after a short beat, unless the user got there first.
  useEffect(() => {
    if (state !== "ended") return;
    const timer = window.setTimeout(close, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // A file that never becomes playable is said, not waited on forever.
  useEffect(() => {
    if (state !== "loading") return;
    const timer = window.setTimeout(() => setState((current) => (current === "loading" ? "failed" : current)), 12_000);
    return () => window.clearTimeout(timer);
  }, [state]);

  return <div className="intro-preview" role="dialog" aria-modal="true" aria-label="Intro video preview">
    <video ref={videoRef} className="intro-preview-video" src={introVideoUrl} muted playsInline autoPlay preload="auto" disablePictureInPicture
      onPlaying={() => setState("playing")} onEnded={() => setState("ended")} onError={() => setState("failed")} />
    <div className="intro-preview-wordmark" aria-hidden="true"><p className="intro-preview-name">Sports Genome</p><p className="intro-preview-label">Decoding performance</p></div>
    {state === "loading" && <p className="intro-preview-status" role="status">Loading the intro…</p>}
    {state === "failed" && <p className="intro-preview-status" role="alert">The intro could not be loaded. Close to return to About me.</p>}
    <button ref={closeRef} type="button" className="intro-preview-close" onClick={() => { emitInteractionFeedback(); close(); }} aria-label="Close intro preview"><X className="h-5 w-5" aria-hidden="true" /> Close</button>
  </div>;
}
