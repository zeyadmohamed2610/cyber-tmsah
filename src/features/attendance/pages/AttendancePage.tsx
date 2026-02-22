import { Navigate } from "react-router-dom";
import { LoadingScreen } from "@/components/Loading";
import { useAttendanceAuth } from "../context/AttendanceAuthContext";
import AttendanceForbiddenPage from "./AttendanceForbiddenPage";

const AttendancePage = () => {
  const { user, role, loading } = useAttendanceAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/attendance/login" replace />;
  }

  if (role === "owner") {
    return <Navigate to="/attendance/owner" replace />;
  }

  if (role === "doctor") {
    return <Navigate to="/attendance/doctor" replace />;
  }

  if (role === "student") {
    return <Navigate to="/attendance/student" replace />;
  }

  return <AttendanceForbiddenPage />;
};

export default AttendancePage;
