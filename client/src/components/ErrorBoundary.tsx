import { cn } from "@/lib/utils";
import { dismissBootSplash } from "@/lib/bootSplash";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // The boot screen is dismissed by a component inside this boundary, so a caught
    // error would otherwise unmount the only thing that lifts it and render this
    // message underneath a full-screen opaque overlay.
    dismissBootSplash({ immediate: true });
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      // The message, not the stack: a production stack is minified and tells the athlete
      // nothing. The stack is still shown while developing.
      const detail = error instanceof Error ? error.message : String(error);
      return (
        <div role="alert" className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 text-center">
            <AlertTriangle
              size={48}
              aria-hidden="true"
              className="text-primary mb-6 flex-shrink-0"
            />

            <h1 className="text-xl mb-2">Sports Genome hit a problem</h1>
            <p className="mb-6 text-[var(--sg-text-muted-on-light)]">
              Nothing you have saved was changed. Reloading usually fixes this.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reload
            </button>

            <details className="w-full mt-6 p-4 rounded-lg bg-card border border-border text-left">
              <summary className="cursor-pointer text-[var(--sg-text-muted-on-light)]">Technical detail</summary>
              <pre className="mt-3 text-sm whitespace-break-spaces break-words text-[var(--sg-text-muted-on-light)]">
                {detail}
              </pre>
              {import.meta.env.DEV && error?.stack && (
                <pre className="mt-3 text-sm whitespace-break-spaces break-words text-[var(--sg-text-muted-on-light)]">
                  {error.stack}
                </pre>
              )}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
