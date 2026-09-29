import { Button } from "@/components/ui/button";
import { Compass, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--sg-surface-light-sunken)] text-[var(--sg-text-on-light)] dark:bg-[var(--sg-surface-deep)] dark:text-[var(--sg-text-on-dark)] dark:[--sg-label-color:var(--sg-text-subtle-on-dark)]">
      <main className="w-full max-w-lg mx-4 py-8 text-center">
        <div className="flex justify-center mb-6">
          <Compass className="h-12 w-12 text-[var(--sg-info-strong)] dark:text-[var(--sg-info)]" aria-hidden />
        </div>

        <p className="metric-label">404 · Not found</p>

        <h1 className="mt-2 mb-4 text-3xl font-bold">Nothing lives at this address.</h1>

        <p className="mb-8 leading-relaxed text-[var(--sg-text-muted-on-light)] dark:text-[var(--sg-text-muted-on-dark)]">
          Every screen in Sports Genome is reachable from Home.
        </p>

        <div
          id="not-found-button-group"
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            size="lg"
            onClick={handleGoHome}
            className="min-h-11 bg-[var(--sg-action-fill)] hover:bg-[var(--sg-action-strong)] text-[var(--sg-action-on)]"
          >
            <Home className="w-4 h-4" aria-hidden />
            Go to Home
          </Button>
        </div>
      </main>
    </div>
  );
}
