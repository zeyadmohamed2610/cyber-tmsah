import { useEffect, useMemo, useState } from "react";
import type { AttendanceRole } from "../types";

const STORAGE_KEY = "attendance.role";
const AVAILABLE_ROLES: AttendanceRole[] = ["owner", "doctor", "student"];

const isAttendanceRole = (value: string): value is AttendanceRole => {
  return AVAILABLE_ROLES.includes(value as AttendanceRole);
};

export const useAttendanceRole = (defaultRole: AttendanceRole = "student") => {
  const [role, setRoleState] = useState<AttendanceRole>(defaultRole);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isAttendanceRole(stored)) {
      setRoleState(stored);
    }
  }, []);

  const setRole = (nextRole: AttendanceRole) => {
    setRoleState(nextRole);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextRole);
    }
  };

  const roleOptions = useMemo(
    () => [
      { value: "owner" as const, label: "Owner Dashboard" },
      { value: "doctor" as const, label: "Doctor Dashboard" },
      { value: "student" as const, label: "Student Dashboard" },
    ],
    [],
  );

  return { role, setRole, roleOptions };
};
