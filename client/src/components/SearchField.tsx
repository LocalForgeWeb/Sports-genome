import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Search } from "lucide-react";
import "../search-field.css";

/**
 * One search control, one focus treatment (Oct 2 brief §3).
 *
 * Every search box used to be a wrapper with its own border wrapped around an
 * input that kept the browser's - or a screen's - focus outline. Focused, both
 * drew: the catalog's wrapper turned gold and the input added a 2px gold outline
 * 2px outside itself, so two rounded rectangles stacked; Add Exercises put a 3px
 * blue ring inside a square border. Here the label is the control: it owns the
 * ground, the border, the radius and the focus ring (`:focus-within`), and the
 * input inside draws none of them. Keyboard focus stays visible, on the one shape
 * the athlete sees as the field.
 */
export type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "children"> & {
  /** Extra classes on the field (the label). */
  className?: string;
  /** "dark" (default) for the app's navy surfaces, "light" for white sheets and cards. */
  tone?: "dark" | "light";
  /** Anything that belongs inside the field after the input, such as a clear button. */
  trailing?: ReactNode;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ className, tone = "dark", trailing, ...input }, ref) {
  return (
    <label className={`${className ? `${className} ` : ""}sg-search-field`} data-tone={tone}>
      <Search className="sg-search-field-icon" aria-hidden="true" />
      <input ref={ref} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" {...input} className="sg-search-input" />
      {trailing}
    </label>
  );
});
