import { useCallback, useEffect, useState } from "react";
import { attendanceService } from "../services/attendanceService";
import type {
  AttendanceRecord,
  AttendanceRole,
  AttendanceTrendPoint,
  DashboardMetrics,
  SessionSummary,
  SubjectAttendanceMetric,
} from "../types";

const EMPTY_METRICS: DashboardMetrics = {
  totalSessions: 0,
  totalStudents: 0,
  activeSessions: 0,
  attendanceRate: 0,
  pendingSubmissions: 0,
};

export const useAttendanceDashboardData = (role: AttendanceRole, userId?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [trendPoints, setTrendPoints] = useState<AttendanceTrendPoint[]>([]);
  const [subjectMetrics, setSubjectMetrics] = useState<SubjectAttendanceMetric[]>([]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [metricsResult, sessionsResult, recordsResult, trendResult, subjectResult] = await Promise.all([
      attendanceService.fetchDashboardMetrics(role, userId),
      attendanceService.fetchSessionsByRole(role, userId),
      attendanceService.fetchAttendanceRecords(role, userId),
      attendanceService.fetchTrendData(role, userId),
      attendanceService.fetchSubjectMetrics(role, userId),
    ]);

    if (metricsResult.data) {
      setMetrics(metricsResult.data);
    } else {
      setMetrics(EMPTY_METRICS);
    }

    setSessions(sessionsResult.data ?? []);
    setRecords(recordsResult.data ?? []);
    setTrendPoints(trendResult.data ?? []);
    setSubjectMetrics(subjectResult.data ?? []);

    const firstError =
      metricsResult.error ||
      sessionsResult.error ||
      recordsResult.error ||
      trendResult.error ||
      subjectResult.error ||
      null;

    setError(firstError);
    setLoading(false);
  }, [role, userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    loading,
    error,
    metrics,
    sessions,
    records,
    trendPoints,
    subjectMetrics,
    refetch,
  };
};
