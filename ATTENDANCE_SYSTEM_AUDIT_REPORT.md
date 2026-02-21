# ATTENDANCE SYSTEM AUDIT REPORT

## 1) Project Scan Results
- Framework stack: Vite + React + TypeScript + Tailwind CSS.
- Router setup: `BrowserRouter` + `Routes` in `src/App.tsx`.
- Existing route pattern: centrally declared routes with lazy-loaded page components.
- Main layout wrapper: `src/components/Layout.tsx`.
- Layout usage pattern: each page wraps itself with `<Layout>`.
- Theme system: Tailwind token-based design in `src/index.css`, `darkMode: ["class"]` in `tailwind.config.ts`.
- Alias paths: `@/* -> ./src/*` via `tsconfig.app.json` and `tsconfig.json`.
- Folder architecture: `src/pages` (routes), `src/components` + `src/components/ui` (shared UI), `src/hooks`, `src/lib`, `src/data`.

## 2) Files Created
- `src/features/attendance/types/index.ts`
- `src/features/attendance/services/authService.ts`
- `src/features/attendance/services/attendanceService.ts`
- `src/features/attendance/services/reportService.ts`
- `src/features/attendance/hooks/useAttendanceRole.ts`
- `src/features/attendance/hooks/useAttendanceDashboardData.ts`
- `src/features/attendance/utils/rotatingSession.ts`
- `src/features/attendance/components/ProtectedRoute.tsx`
- `src/features/attendance/components/DataTable.tsx`
- `src/features/attendance/components/StatCard.tsx`
- `src/features/attendance/components/AttendanceSubmissionForm.tsx`
- `src/features/attendance/components/ExportButtons.tsx`
- `src/features/attendance/components/RotatingSessionDisplay.tsx`
- `src/features/attendance/components/charts/chartRegistry.ts`
- `src/features/attendance/components/charts/AttendanceTrendChart.tsx`
- `src/features/attendance/components/charts/AttendanceStatusChart.tsx`
- `src/features/attendance/components/charts/AttendanceSubjectChart.tsx`
- `src/features/attendance/pages/AttendancePage.tsx`
- `src/features/attendance/pages/OwnerDashboard.tsx`
- `src/features/attendance/pages/DoctorDashboard.tsx`
- `src/features/attendance/pages/StudentDashboard.tsx`
- `supabase_backend/schema.sql`
- `supabase_backend/rls_policies.sql`
- `supabase_backend/rpc_functions.sql`
- `supabase_backend/edge_functions/generateRotatingHash.ts`
- `supabase_backend/edge_functions/submitAttendance.ts`
- `supabase_backend/SECURITY_ARCHITECTURE.md`

## 3) Files Modified
- `src/App.tsx`
  - Added lazy-loaded attendance page import.
  - Added new route entry for `/attendance`.
  - Included inline comments describing the surgical routing change.

## 4) Route Changes
- Added route:
  - `/attendance` -> `src/features/attendance/pages/AttendancePage.tsx`
- Existing routes (`/schedule`, `/materials`, `/materials/:id`) were not altered.
- Main layout integration preserved by wrapping attendance page content with `Layout`.

## 5) Database Schema Explanation
- Created tables:
  - `users`: application role mapping, lockout fields, actor metadata.
  - `subjects`: owner-managed subject catalog.
  - `sessions`: doctor-linked sessions with geofence fields and timing constraints.
  - `attendance`: secure attendance rows with nonce, rotating hash, IP/device metadata.
  - `system_logs`: audit trail for auth and attendance security events.
- Data model controls:
  - UUID primary keys.
  - Foreign keys enforcing user/subject/session relationships.
  - ENUM types for role, session status, attendance status, log severity.
  - Uniques for anti-duplicate and anti-replay (`(session_id, student_id)`, `request_nonce`).

## 6) RLS Explanation
- `users`: self-read or owner-read only.
- `sessions`:
  - doctor sees only own sessions.
  - student sees open sessions (`scheduled`, `active`).
  - owner sees all.
- `attendance`:
  - student reads only own records.
  - doctor reads records for sessions they own.
  - owner full read.
  - no direct insert/update/delete policy (insert path is RPC only).
- `system_logs`: owner full read, actor self-read.
- Direct writes revoked from `anon` and `authenticated` across core tables.

## 7) Edge Function Explanation
- `generateRotatingHash.ts`:
  - Computes `HMAC_SHA256(session_id:time_window, SERVER_SECRET)`.
  - Uses 30-second rolling windows.
  - Returns hash, window, and expiry seconds.
- `submitAttendance.ts`:
  - Validates JWT.
  - Enforces rate limiting per minute by IP/device.
  - Validates session state and time bounds.
  - Validates rotating hash and time window.
  - Validates geolocation with Haversine.
  - Detects replay (`request_nonce`) and duplicates.
  - Logs attempts/failures.
  - Submits via secure RPC (`rpc_submit_attendance`).

## 8) Security Architecture Overview
- Defense layers:
  - Edge validation.
  - Security-definer RPC enforcement.
  - RLS-based read scoping and blocked direct writes.
  - Trigger-level role escalation protection.
- Hardening controls:
  - Failed login tracking and lockout after 5 attempts.
  - Suspicious activity logging to `system_logs`.
  - Session end-time enforcement.
  - Replay and duplicate prevention.
  - Geofence and rotating hash verification.

## 9) Performance Optimizations
- Added indexes for common filters and ordering:
  - `sessions(doctor_id, starts_at)`, `sessions(status, starts_at)`
  - `attendance(student_id, submitted_at)`, `attendance(session_id, submitted_at)`, `attendance(request_nonce)`
  - `system_logs(action, created_at)`, `system_logs(ip_address, created_at)`
- Frontend route remains lazy-loaded to reduce initial bundle impact.
- Reusable components avoid duplicate render logic and improve maintainability.

## 10) Deployment Instructions
1. Apply DB schema:
   - Run `supabase_backend/schema.sql`.
2. Apply RLS and grants:
   - Run `supabase_backend/rls_policies.sql`.
3. Apply RPC functions:
   - Run `supabase_backend/rpc_functions.sql`.
4. Set DB config secret for RPC hash validation:
   - `app.settings.server_secret`.
5. Deploy edge functions:
   - `supabase_backend/edge_functions/generateRotatingHash.ts`
   - `supabase_backend/edge_functions/submitAttendance.ts`
6. Set edge function environment variables (see section 11).
7. Wire frontend services in:
   - `src/features/attendance/services/*.ts`
8. Build verification:
   - `npm run build` (verified successful in this workspace).

## 11) Required Environment Variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (frontend when wiring live services)
- `SUPABASE_SERVICE_ROLE_KEY` (edge function secure operations)
- `SERVER_SECRET` (edge function rotating hash)
- DB setting: `app.settings.server_secret` (RPC rotating hash validation)

## 12) Future Scalability Recommendations
- Add pagination and server-side filtering for attendance and logs.
- Introduce queue/worker for heavy report exports.
- Partition `attendance` and `system_logs` by term/time for large datasets.
- Add Redis or edge cache-backed global rate limiting.
- Add signed URL export delivery with short TTL and audit markers.
- Add anomaly detection jobs on `system_logs` for proactive fraud detection.
