import type { AttendanceApiResponse, AttendanceRole } from "../types";
import { supabase } from "@/lib/supabaseClient";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "doctor" | "student";
}

export interface CreatedUser {
  id: string;
  name: string;
  email: string;
  role: AttendanceRole;
}

type CreateUserResponse = {
  success?: boolean;
  user?: CreatedUser;
  error?: string;
};

const ok = <T>(data: T): AttendanceApiResponse<T> => ({
  data,
  error: null,
});

const fail = <T>(error: string): AttendanceApiResponse<T> => ({
  data: null,
  error,
});

export const userService = {
  async createUser(input: CreateUserInput): Promise<AttendanceApiResponse<CreatedUser>> {
    const operation = "userService.createUser";

    try {
      const { data, error } = await supabase.functions.invoke<CreateUserResponse>("createUser", {
        body: {
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          password: input.password,
          role: input.role,
        },
      });

      if (error) {
        const message = error.message || error.toString();
        return fail<CreatedUser>(message);
      }

      if (!data) {
        return fail<CreatedUser>("No response from server.");
      }

      if (data.error) {
        return fail<CreatedUser>(data.error);
      }

      if (!data.success || !data.user) {
        return fail<CreatedUser>("Failed to create user.");
      }

      return ok<CreatedUser>(data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail<CreatedUser>(`${operation} failed: ${message}`);
    }
  },
};
