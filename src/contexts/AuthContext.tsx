import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "Owner" | "Manager" | "QA" | "Staff" | "Auditor";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  organization_id: string | null;
  branch_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  onboardingError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signOut: () => Promise<void>;
  registerOrganization: (orgName: string, fullName: string) => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const provisioningUsersRef = useRef<Set<string>>(new Set());
  const hydrationPromisesRef = useRef<Map<string, Promise<void>>>(new Map());

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[Auth] Failed to fetch profile:", error);
      return null;
    }

    return (data as Profile | null) ?? null;
  }, []);

  const fetchRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("[Auth] Failed to fetch roles:", error);
      return [];
    }

    return (data || []).map((r) => r.role as AppRole);
  }, []);

  const ensureOrganizationContext = useCallback(async (authUser: User, currentProfile: Profile | null) => {
    if (currentProfile?.organization_id && currentProfile?.branch_id) {
      return;
    }

    if (provisioningUsersRef.current.has(authUser.id)) {
      return;
    }

    provisioningUsersRef.current.add(authUser.id);

    try {
      const metadataFullName = typeof authUser.user_metadata?.full_name === "string"
        ? authUser.user_metadata.full_name
        : "";
      const fallbackFullName = currentProfile?.full_name?.trim() || metadataFullName || authUser.email?.split("@")[0] || "User";

      console.log("[Auth] Missing organization/branch. Running automatic onboarding...");

      const { error } = await supabase.rpc("register_organization", {
        _org_name: "My Organization",
        _full_name: fallbackFullName,
      });

      if (error) {
        console.error("[Auth] Automatic onboarding failed:", error);
        setOnboardingError(error.message);
        return;
      }

      console.log("[Auth] Automatic onboarding completed.");
      setOnboardingError(null);
    } catch (err) {
      console.error("[Auth] Unexpected onboarding error:", err);
      setOnboardingError(err instanceof Error ? err.message : "Unexpected onboarding error");
    } finally {
      provisioningUsersRef.current.delete(authUser.id);
    }
  }, []);

  const hydrateUserContext = useCallback(async (authUser: User) => {
    const existingHydration = hydrationPromisesRef.current.get(authUser.id);
    if (existingHydration) {
      await existingHydration;
      return;
    }

    const hydrationPromise = (async () => {
      setLoading(true);
      setOnboardingError(null);

      try {
        let nextProfile = await fetchProfile(authUser.id);
        await ensureOrganizationContext(authUser, nextProfile);
        nextProfile = await fetchProfile(authUser.id);
        const nextRoles = await fetchRoles(authUser.id);

        setProfile(nextProfile);
        setRoles(nextRoles);
      } catch (err) {
        console.error("[Auth] Failed to initialize user context:", err);
        setOnboardingError(err instanceof Error ? err.message : "Failed to initialize account state");
        setProfile(null);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    })();

    hydrationPromisesRef.current.set(authUser.id, hydrationPromise);

    try {
      await hydrationPromise;
    } finally {
      hydrationPromisesRef.current.delete(authUser.id);
    }
  }, [fetchProfile, fetchRoles, ensureOrganizationContext]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await hydrateUserContext(user);
  }, [user, hydrateUserContext]);

  useEffect(() => {
    let isMounted = true;

    const syncFromSession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setRoles([]);
        setOnboardingError(null);
        setLoading(false);
        return;
      }

      await hydrateUserContext(nextUser);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        void syncFromSession(nextSession);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      void syncFromSession(existingSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUserContext]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error as Error | null, needsVerification: false };

    const needsVerification = !data.session;
    return { error: null, needsVerification };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const registerOrganization = async (orgName: string, fullName: string) => {
    const { error } = await supabase.rpc("register_organization", {
      _org_name: orgName,
      _full_name: fullName,
    });

    if (!error) {
      await refreshProfile();
    }

    return { error: error as Error | null };
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        onboardingError,
        signIn,
        signUp,
        signOut,
        registerOrganization,
        hasRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
