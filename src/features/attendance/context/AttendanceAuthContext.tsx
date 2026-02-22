import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { AttendanceRole } from "../types";

interface AttendanceAuthContextValue {
  user: User | null;
  role: AttendanceRole | null;
  loading: boolean;
  signOut: () => Promise<{ error: string | null }>;
}

const AttendanceAuthContext = createContext<AttendanceAuthContextValue | undefined>(undefined);

const isAttendanceRole = (value: unknown): value is AttendanceRole => {
  return value === "owner" || value === "doctor" || value === "student";
};

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
        return;
      }

      setLoading(true);
      setUser(session.user);

      try {
        const nextRole = await fetchUserRole(session.user.id);
        if (!active) {
          return;
        }
        setRole(nextRole);
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
