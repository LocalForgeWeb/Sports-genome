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
       * Centred, and clear of the navigation.
       *
       * Sonner's default is bottom-right with a 32px offset, which on a phone
       * is a full-width slab at the very bottom of the screen - exactly where
       * this app pins its four destinations. The mobile offset clears the bar
       * (4.375rem of targets and border) plus the home-indicator inset, and
       * leaves a gap so the two read as separate things.
       */
      position="bottom-center"
      mobileOffset={{ bottom: "calc(4.375rem + env(safe-area-inset-bottom, 0px) + .75rem)", left: ".75rem", right: ".75rem" }}
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
