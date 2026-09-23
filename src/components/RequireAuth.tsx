import { ShieldAlert } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

/**
 * Route guard for the staff dashboard. UX-level only — the real
 * enforcement lives in Supabase Row Level Security policies.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { configured, loading, session, isStaff, signOut, user } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="size-9 text-brass" aria-hidden="true" />
        <h1 className="display-md text-bone">Dashboard not configured</h1>
        <p className="copy-sm max-w-md">
          Set <code className="text-brass">VITE_SUPABASE_URL</code> and{" "}
          <code className="text-brass">VITE_SUPABASE_ANON_KEY</code> in your{" "}
          <code className="text-brass">.env</code> file, then restart the dev server. See
          DEPLOYMENT.md for the full free-tier setup.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="shell flex min-h-dvh flex-col gap-4 py-24" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <span className="sr-only">Checking your session…</span>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isStaff) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="size-9 text-ember-light" aria-hidden="true" />
        <h1 className="display-md text-bone">No staff access</h1>
        <p className="copy-sm max-w-md">
          {user?.email ?? "This account"} is signed in but is not registered as Dangbu staff. Ask
          the owner to add your account on the Staff page.
        </p>
        <Button variant="outline" onClick={() => void signOut()}>
          Sign out
        </Button>
      </main>
    );
  }

  return <>{children}</>;
}
