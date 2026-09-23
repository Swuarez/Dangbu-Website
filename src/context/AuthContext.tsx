import type { Session, User } from "@supabase/supabase-js";
import * as React from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { DbStaffProfile, StaffRole } from "@/types/database";

/* ============================================================
   Staff authentication context (Supabase Auth, free tier).
   Sessions persist in localStorage and auto-refresh. Role comes
   from staff_profiles — enforced again by RLS on every query.
   ============================================================ */

export interface AuthState {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: DbStaffProfile | null;
  role: StaffRole | null;
  isStaff: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

async function loadProfile(userId: string): Promise<DbStaffProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as DbStaffProfile | null) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(isSupabaseConfigured);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<DbStaffProfile | null>(null);

  React.useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        setSession(data.session ?? null);
        if (data.session?.user) {
          setProfile(await loadProfile(data.session.user.id));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        // Defer so we never block Supabase's internal auth callback.
        window.setTimeout(() => {
          void loadProfile(nextSession.user.id).then(setProfile);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        throw new Error("Incorrect email or password.");
      }
      throw new Error(error.message || "Could not sign in. Please try again.");
    }
  }, []);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (session?.user) setProfile(await loadProfile(session.user.id));
  }, [session]);

  const value: AuthState = {
    configured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isStaff: profile !== null,
    isOwner: profile?.role === "owner",
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
