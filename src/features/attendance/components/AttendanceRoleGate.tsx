import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/Loading";
import type { AttendanceRole } from "../types";
import { useAttendanceAuth } from "../context/AttendanceAuthContext";

interface AttendanceRoleGateProps {
  allowedRole: AttendanceRole;
  children: ReactNode;
}

export const AttendanceRoleGate = ({ allowedRole, children }: AttendanceRoleGateProps) => {
  const location = useLocation();
  const { user, role, loading } = useAttendanceAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/attendance/login" replace state={{ from: location.pathname }} />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/attendance" replace />;
  }

  return <>{children}</>;
};
