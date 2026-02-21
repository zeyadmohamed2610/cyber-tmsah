import type {
  AttendanceApiResponse,
  AttendanceRecord,
  AttendanceRole,
  AttendanceSubmissionInput,
  AttendanceSubmissionResult,
  AttendanceTrendPoint,
  DashboardMetrics,
  SessionSummary,
  SubjectAttendanceMetric,
} from "../types";

const notConfigured = <T>(operation: string): AttendanceApiResponse<T> => ({
  data: null,
  error: `${operation} is not configured. Connect the Supabase attendance backend.`,
});

export const attendanceService = {
  async fetchDashboardMetrics(role: AttendanceRole, userId?: string): Promise<AttendanceApiResponse<DashboardMetrics>> {
    void role;
    void userId;
    return notConfigured<DashboardMetrics>("attendanceService.fetchDashboardMetrics");
  },

  async fetchSessionsByRole(role: AttendanceRole, userId?: string): Promise<AttendanceApiResponse<SessionSummary[]>> {
    void role;
    void userId;
    return notConfigured<SessionSummary[]>("attendanceService.fetchSessionsByRole");
  },

  async fetchAttendanceRecords(
    role: AttendanceRole,
    userId?: string,
  ): Promise<AttendanceApiResponse<AttendanceRecord[]>> {
    void role;
    void userId;
    return notConfigured<AttendanceRecord[]>("attendanceService.fetchAttendanceRecords");
  },

  async fetchTrendData(role: AttendanceRole, userId?: string): Promise<AttendanceApiResponse<AttendanceTrendPoint[]>> {
    void role;
    void userId;
    return notConfigured<AttendanceTrendPoint[]>("attendanceService.fetchTrendData");
  },

  async fetchSubjectMetrics(
    role: AttendanceRole,
    userId?: string,
  ): Promise<AttendanceApiResponse<SubjectAttendanceMetric[]>> {
    void role;
    void userId;
    return notConfigured<SubjectAttendanceMetric[]>("attendanceService.fetchSubjectMetrics");
  },

  async submitAttendance(
    payload: AttendanceSubmissionInput,
  ): Promise<AttendanceApiResponse<AttendanceSubmissionResult>> {
    void payload;
    return notConfigured<AttendanceSubmissionResult>("attendanceService.submitAttendance");
  },
};
