/** Kinetic Field Manual: keep the product shell calm and light so training signals remain legible. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { BootSplashLifecycle } from "./components/BootSplashLifecycle";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// The theme is the athlete's choice, stored and resolved in ThemeProvider, and
// applied to <html> by the inline script in index.html before the first frame so
// the chrome does not flash. See client/src/lib/theme.ts.

function App() {
  return (
    <ErrorBoundary>
      {/* Outside the providers: dismissing the boot screen must not depend on any of
          them rendering successfully, or a provider that throws leaves the app
          unreachable behind it. */}
      <BootSplashLifecycle />
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
