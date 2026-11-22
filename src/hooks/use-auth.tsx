import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { fetchProfile } from "@/api/auth";
import { supabase } from "@/lib/supabase";
import type { AdminProfile } from "@/lib/types";

interface AuthState {
  /** True until we know whether someone is signed in and, if so, whether they have an active admin/staff profile. */
  loading: boolean;
  userId: string | null;
  /** The active admin/staff profile, or null for signed-out visitors and accounts without admin access. */
  profile: AdminProfile | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Wrap only the admin routes: the public site never needs to know about auth. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Fires once with the stored session, then again on every sign-in / sign-out / token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;
  const profileQuery = useQuery({ queryKey: ["admin-profile", userId], queryFn: () => fetchProfile(userId!), enabled: !!userId });

  const value = useMemo<AuthState>(() => ({
    loading: session === undefined || (!!userId && profileQuery.isPending),
    userId,
    profile: profileQuery.data ?? null,
    signOut: async () => {
      await supabase.auth.signOut();
      queryClient.clear(); // never keep another person's admin data in memory
    },
  }), [session, userId, profileQuery.isPending, profileQuery.data, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** The signed-in admin/staff profile. Only call this below the `RequireStaff` route guard, which guarantees one exists. */
export function useProfile(): AdminProfile {
  const { profile } = useAuth();
  if (!profile) throw new Error("useProfile must be used inside RequireStaff");
  return profile;
}
