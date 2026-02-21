import type { AttendanceApiResponse, AuthUser } from "../types";

const notConfigured = <T>(operation: string): AttendanceApiResponse<T> => ({
  data: null,
  error: `${operation} is not configured. Connect the Supabase auth backend.`,
});

export const authService = {
  async getCurrentUser(): Promise<AttendanceApiResponse<AuthUser>> {
    return notConfigured<AuthUser>("authService.getCurrentUser");
  },

  async signInWithPassword(email: string, password: string): Promise<AttendanceApiResponse<AuthUser>> {
    void email;
    void password;
    return notConfigured<AuthUser>("authService.signInWithPassword");
  },

  async signOut(): Promise<AttendanceApiResponse<null>> {
    return notConfigured<null>("authService.signOut");
  },

  async recordFailedLoginAttempt(email: string, ipAddress?: string): Promise<AttendanceApiResponse<null>> {
    void email;
    void ipAddress;
    return notConfigured<null>("authService.recordFailedLoginAttempt");
  },

  async clearFailedLoginAttempts(userId: string): Promise<AttendanceApiResponse<null>> {
    void userId;
    return notConfigured<null>("authService.clearFailedLoginAttempts");
  },
};
