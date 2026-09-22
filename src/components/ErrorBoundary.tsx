import { RefreshCw, TriangleAlert } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render-time crashes so guests always get a usable page. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    // Hook a real logger (Sentry, LogRocket…) in here when wiring a backend.
    console.error("[Dangbu] Unhandled UI error:", error);
  }

  override render(): React.ReactNode {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="shell flex min-h-[70dvh] flex-col items-center justify-center gap-5 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>

        <h1 className="display-lg text-bone">Something burned on the grill</h1>
        <p className="copy max-w-[56ch]">
          An unexpected error interrupted the page. Reload to continue, or call us at 0945 673 2698
          and we will take your reservation over the phone.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button variant="ember" size="lg" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Reload page
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/">Back to home</a>
          </Button>
        </div>
      </div>
    );
  }
}
