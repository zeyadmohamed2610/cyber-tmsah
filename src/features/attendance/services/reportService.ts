import type { AttendanceApiResponse, ExportRequest, ExportResult, SystemLogEntry } from "../types";

const notConfigured = <T>(operation: string): AttendanceApiResponse<T> => ({
  data: null,
  error: `${operation} is not configured. Connect the Supabase reporting backend.`,
});

export const reportService = {
  async requestExport(request: ExportRequest): Promise<AttendanceApiResponse<ExportResult>> {
    void request;
    return notConfigured<ExportResult>("reportService.requestExport");
  },

  async fetchSystemLogs(): Promise<AttendanceApiResponse<SystemLogEntry[]>> {
    return notConfigured<SystemLogEntry[]>("reportService.fetchSystemLogs");
  },
};
