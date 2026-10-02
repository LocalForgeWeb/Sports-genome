import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * The app's own toast surface.
 *
 * This was the shadcn starter untouched, pointing `--normal-bg`,
 * `--normal-text` and `--normal-border` at `--popover`,
 * `--popover-foreground` and `--border` - three variables this project has
 * never defined. A custom property whose value fails substitution is invalid
 * at computed-value time, so each of those properties resolved to `unset`:
 * the background fell back to `transparent` and the text to whatever it
 * inherited. The toast rendered as bare words lying over the page, which on a
 * phone meant lying over the bottom bar's four labels.
 *
 * So the surface is built from tokens that exist, and it is opaque, because it
 * covers content while it is up.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      /**
       * Dark, because this app is. The theme came from next-themes and fell
       * back to "system", so an athlete on a light phone got sonner's light
       * treatment - which hardcodes a #3f3f3f description - printed on the
       * navy panel below. Nothing here follows the OS; every surface in this
       * product is dark, and so is this one.
       */
      theme="dark"
      /**
       * Centred. Sonner's default is bottom-right with a 32px offset, which on a
       * phone is a full-width slab at the very bottom of the screen - exactly
       * where this app pins its four destinations. How far above them a toast
       * sits has one owner: the `[data-sonner-toaster]` rule in index.css, lifted
       * clear of other bottom controls by lib/feedbackClearance.ts. (A
       * `mobileOffset` here was overridden by that rule and did nothing.)
       */
      position="bottom-center"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--sg-surface-panel)",
          "--normal-text": "var(--sg-text-on-dark)",
          "--normal-border": "var(--sg-control-border-on-dark)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
