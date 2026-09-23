import { Flame, Loader2, LogIn } from "lucide-react";
import * as React from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

/** Staff sign-in (Supabase Auth email + password). */
export default function LoginPage() {
  const { configured, loading, session, isStaff, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Client-side throttling: exponential backoff per failed attempt and a
  // 60-second lock from the 5th failure onward. Server-side, Supabase Auth
  // applies its own rate limits to the token endpoint (see SECURITY.md).
  const failures = React.useRef(0);
  const [cooldownUntil, setCooldownUntil] = React.useState<number | null>(null);

  React.useEffect(() => {
    document.title = "Staff Login — Dangbu Unlimited Samgyupsal & Buffet";
  }, []);

  if (!loading && session && isStaff) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cooldownUntil && Date.now() < cooldownUntil) {
      const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${seconds}s and try again.`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      failures.current = 0;
      setCooldownUntil(null);
      navigate(from, { replace: true });
    } catch (cause) {
      failures.current += 1;
      // Backoff: 2s, 4s, 8s, 15s, then a 60s lock from the 5th failure.
      const delay =
        failures.current >= 5 ? 60_000 : Math.min(2 ** failures.current * 1000, 15_000);
      setCooldownUntil(Date.now() + delay);
      window.setTimeout(() => setCooldownUntil(null), delay);

      const base =
        cause instanceof Error ? cause.message : "Could not sign in. Please try again.";
      setError(
        failures.current >= 5 ? `${base} Login is locked for 60 seconds.` : base,
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="panel w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-full border border-brass/40 bg-ink">
            <Flame className="size-5 text-brass" aria-hidden="true" />
          </span>
          <h1 className="display-md text-bone">Staff login</h1>
          <p className="copy-sm">Dangbu dashboard — Owner &amp; Staff only.</p>
        </div>

        {!configured ? (
          <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-center font-sans text-[0.8rem] text-ember-light">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env —
            see DEPLOYMENT.md.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate={false}>
            <div className="grid gap-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@dangbu.ph"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 p-3 font-sans text-[0.8rem] text-ember-light">
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="ember" size="lg" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogIn className="size-4" aria-hidden="true" />
              )}
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center">
          <Link
            to="/"
            className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-ash-text underline-offset-4 transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-brass"
          >
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
