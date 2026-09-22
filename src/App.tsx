import { useReducedMotion } from "motion/react";
import * as React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationIntentProvider } from "@/context/ReservationIntentContext";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

/** The booking status page is split out of the main bundle. */
const ReservationStatusPage = React.lazy(() => import("@/pages/ReservationStatusPage"));

/** Keeps hash links (/#menu) and route changes scrolling predictably. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash, reduceMotion]);

  return null;
}

function RouteFallback() {
  return (
    <div className="shell flex flex-col gap-4 pb-16 pt-28" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-40 w-full" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

export default function App() {
  return (
    <ReservationIntentProvider>
      <a
        href="#main-content"
        className="sr-only rounded-full border border-brass/50 bg-ink px-4 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brass focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200]"
      >
        Skip to content
      </a>

      <div className="flex min-h-dvh flex-col">
        <Navbar />

        <main id="main-content" className="flex-1">
          <ScrollManager />
          <ErrorBoundary>
            <React.Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/reservation/:reference" element={<ReservationStatusPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </React.Suspense>
          </ErrorBoundary>
        </main>

        <Footer />
      </div>

      <Toaster
        theme="dark"
        position="bottom-center"
        closeButton
        toastOptions={{
          style: {
            background: "linear-gradient(180deg, rgba(34,26,22,0.98) 0%, rgba(11,8,6,0.99) 100%)",
            border: "1px solid rgba(231,178,76,0.3)",
            color: "#f8f1e6",
            borderRadius: "14px",
            padding: "14px 16px",
          },
        }}
      />
    </ReservationIntentProvider>
  );
}
