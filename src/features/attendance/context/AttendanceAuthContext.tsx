import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { AttendanceRole } from "../types";

interface AttendanceAuthContextValue {
  user: User | null;
  role: AttendanceRole | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<{ error: string | null }>;
}

const AttendanceAuthContext = createContext<AttendanceAuthContextValue | undefined>(undefined);

const isAttendanceRole = (value: unknown): value is AttendanceRole => {
  return value === "owner" || value === "doctor" || value === "student";
};

/**
 * Extract role from JWT app_role claim (primary source for performance)
 */
const extractRoleFromJWT = (session: Session): AttendanceRole | null => {
  const appRole = session.access_token.split('.')[1];
  if (!appRole) return null;
  
  try {
    // Decode JWT payload (base64)
    const payload = JSON.parse(atob(appRole));
    if (isAttendanceRole(payload.app_role)) {
      return payload.app_role;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Fetch role from database (fallback when JWT doesn't have app_role)
 */
const fetchUserRole = async (userId: string): Promise<AttendanceRole> => {
  const { data, error } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  if (!isAttendanceRole(data?.role)) {
    throw new Error("Unable to resolve user role from public.users.");
  }

  return data.role;
};

export const AttendanceAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AttendanceRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track session ID to detect actual session changes (not just refreshes)
  const sessionIdRef = useRef<string | null>(null);
  // Track if we've already fetched role from DB (for caching)
  const roleFetchedRef = useRef<boolean>(false);

  useEffect(() => {
    let active = true;

    const applySession = async (session: Session | null) => {
      if (!active) {
        return;
      }

      if (!session?.user) {
        setUser(null);
        setRole(null);
        setLoading(false);
        sessionIdRef.current = null;
        roleFetchedRef.current = false;
        return;
      }

      setLoading(true);
      setUser(session.user);

      const currentSessionId = session.access_token;
      const isSameSession = sessionIdRef.current === currentSessionId;
      
      // Only refetch role if session actually changed (not on refresh)
      if (isSameSession && roleFetchedRef.current && role) {
        setLoading(false);
        return;
      }

      // Phase 1: Try to extract role from JWT first (performance optimization)
      const jwtRole = extractRoleFromJWT(session);
      
      if (jwtRole) {
        if (!active) {
          return;
        }
        setRole(jwtRole);
        roleFetchedRef.current = true;
        sessionIdRef.current = currentSessionId;
        setLoading(false);
        return;
      }

      // Fallback: Fetch role from database only if not cached
      try {
        const nextRole = await fetchUserRole(session.user.id);
        if (!active) {
          return;
        }
        setRole(nextRole);
        roleFetchedRef.current = true;
        sessionIdRef.current = currentSessionId;
      } catch (error) {
        if (!active) {
          return;
        }
        console.error("Failed to fetch attendance role:", error);
        setRole(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        await applySession(data.session);
      } catch (error) {
        if (!active) {
          return;
        }
        console.error("Failed to initialize attendance auth session:", error);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshRole = async (): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    roleFetchedRef.current = false;
    
    try {
      const nextRole = await fetchUserRole(user.id);
      setRole(nextRole);
      roleFetchedRef.current = true;
    } catch (error) {
      console.error("Failed to refresh attendance role:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }

    setUser(null);
    setRole(null);
    return { error: null };
  };

  const value = useMemo<AttendanceAuthContextValue>(
    () => ({
      user,
      role,
      loading,
      refreshRole,
      signOut,
    }),
    [loading, role, user],
  );

  return <AttendanceAuthContext.Provider value={value}>{children}</AttendanceAuthContext.Provider>;
};

export const useAttendanceAuth = () => {
  const context = useContext(AttendanceAuthContext);
  if (!context) {
    throw new Error("useAttendanceAuth must be used inside AttendanceAuthProvider.");
  }
  return context;
};
