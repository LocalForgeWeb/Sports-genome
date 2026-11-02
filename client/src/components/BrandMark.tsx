import { useState } from "react";
import { sportsGenomeAssets } from "@/lib/sportsGenomeAssets";

/**
 * The Sports Genome badge or logo, at a size reserved before it loads, with a drawn mark in its
 * place if the image fails (iOS readiness audit, A07). A failed <img> used to show the browser's
 * broken-image icon, or its alt text squeezed into a 44 px circle, in the header of every page.
 *
 * The fallback is the brand's own colours and initials, drawn in SVG, so it needs nothing from
 * the network. It is a stand-in for the artwork, never a replacement: the image is tried first
 * every time the mark mounts.
 */
export function BrandMark({ variant = "badge", size, className, label }: {
  variant?: "badge" | "logo";
  /** The rendered size in CSS pixels, reserved before the image arrives. */
  size: number;
  className?: string;
  /** The accessible name; omit when the mark sits beside the words "Sports Genome". */
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = variant === "badge" ? sportsGenomeAssets.circularBadge : sportsGenomeAssets.officialLogo;
  if (failed) {
    return <svg
      className={`brand-mark-fallback${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-fallback="brand"
    >
      <circle cx="32" cy="32" r="31" fill="#0b2240" stroke="#2d6cdf" strokeWidth="2" />
      <text x="32" y="41" textAnchor="middle" fill="#f7f5ef" fontFamily='"Barlow Condensed", "DM Sans", system-ui, sans-serif' fontSize="25" fontWeight="800" letterSpacing="1">SG</text>
    </svg>;
  }
  return <img
    src={src}
    alt={label ?? ""}
    width={size}
    height={size}
    className={className}
    decoding="async"
    onError={() => setFailed(true)}
  />;
}
