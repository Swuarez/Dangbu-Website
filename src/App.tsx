import * as React from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CookieNotice } from "@/components/CookieNotice";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider } from "@/context/AuthContext";
import { useMotionPreference } from "@/context/MotionPreferenceContext";
import { ReservationIntentProvider } from "@/context/ReservationIntentContext";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

/** Code-split routes: status page, menu viewer, login + staff dashboard. */
const ReservationStatusPage = React.lazy(() => import("@/pages/ReservationStatusPage"));
const MenuViewerPage = React.lazy(() => import("@/pages/MenuViewerPage"));
const PrivacyPolicyPage = React.lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = React.lazy(() => import("@/pages/TermsPage"));
const LoginPage = React.lazy(() => import("@/pages/LoginPage"));
const DashboardLayout = React.lazy(() => import("@/layouts/DashboardLayout"));
const DashboardHomePage = React.lazy(() => import("@/pages/dashboard/DashboardHomePage"));
const ReservationsPage = React.lazy(() => import("@/pages/dashboard/ReservationsPage"));
const AnnouncementsPage = React.lazy(() => import("@/pages/dashboard/AnnouncementsPage"));
const StaffPage = React.lazy(() => import("@/pages/dashboard/StaffPage"));
const SettingsPage = React.lazy(() => import("@/pages/dashboard/SettingsPage"));

/** Keeps hash links (/#menu) and route changes scrolling predictably. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const { reduced: reduceMotion } = useMotionPreference();

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

/** Public chrome: announcement strip on top, navbar, content, footer. */
function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieNotice />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReservationIntentProvider>
        <a
          href="#main-content"
          className="sr-only rounded-full border border-brass/50 bg-ink px-4 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brass focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200]"
        >
          Skip to content
        </a>

        <ScrollManager />
        <ErrorBoundary>
          <React.Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/reservation/:reference" element={<ReservationStatusPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Full-screen menu viewer fallback route, no site chrome */}
              <Route path="/menu/:package" element={<MenuViewerPage />} />

              {/* Staff area */}
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<DashboardHomePage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </React.Suspense>
        </ErrorBoundary>

        <Toaster
          theme="dark"
          position="bottom-center"
          closeButton
          toastOptions={{
            style: {
              background:
                "linear-gradient(180deg, rgba(34,26,22,0.98) 0%, rgba(11,8,6,0.99) 100%)",
              border: "1px solid rgba(231,178,76,0.3)",
              color: "#f8f1e6",
              borderRadius: "14px",
              padding: "14px 16px",
            },
          }}
        />
      </ReservationIntentProvider>
    </AuthProvider>
  );
}

