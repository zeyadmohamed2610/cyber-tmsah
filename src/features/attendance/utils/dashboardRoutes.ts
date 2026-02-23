import type { AttendanceRole } from "../types";

export const attendanceDashboardRoutes: Record<AttendanceRole, string> = {
  owner: "/attendance/owner-dashboard",
  doctor: "/attendance/doctor-dashboard",
  student: "/attendance/student-panel",
};

export const getAttendanceDashboardRoute = (role: AttendanceRole): string => {
  return attendanceDashboardRoutes[role];
};
