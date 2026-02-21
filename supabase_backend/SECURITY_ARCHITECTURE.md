# Attendance Security Architecture

## 1) Trust Boundaries
- Client app: untrusted input source.
- Edge functions: first trusted boundary for request validation and abuse control.
- Postgres RPC (security definer): authoritative write gate.
- Core tables with RLS + revoked direct write grants: protected data layer.

## 2) Authentication and Role Model
- Identity source: Supabase Auth (`auth.users`).
- App profile source: `public.users` with `user_role` enum (`owner`, `doctor`, `student`).
- Role escalation is blocked by:
  - Trigger `tg_prevent_role_escalation`.
  - Owner-only RPC `rpc_owner_set_user_role`.
  - No direct table write privileges for authenticated users.

## 3) Attendance Submission Security Flow
1. Client submits attendance to `edge_functions/submitAttendance.ts`.
2. Edge validates JWT, rate limits, session window, rotating hash, geofence, replay nonce, duplicate attendance.
3. Edge calls `rpc_submit_attendance` with validated payload.
4. RPC re-validates critical checks server-side and inserts attendance.
5. `system_logs` captures attempts, failures, and successful writes with IP + device hash.

## 4) Rotating Hash Model
- Hash formula: `HMAC_SHA256(session_id + ":" + time_window, SERVER_SECRET)`.
- Window duration: 30 seconds.
- Edge function `generateRotatingHash.ts` generates hashes for active windows.
- RPC validates submitted hash using DB-side secret setting (`app.settings.server_secret`).

## 5) Abuse Prevention Controls
- Login failure tracking with lockout after 5 failed attempts (`rpc_record_failed_login`).
- Account lock interval and reset workflow (`rpc_clear_failed_login`).
- Attendance rate limiting by IP/device for 1-minute windows.
- Replay protection via unique `request_nonce`.
- Duplicate prevention via unique `(session_id, student_id)`.
- Session end-time enforcement in trigger + RPC (`no attendance after ends_at`).

## 6) Row-Level Security Strategy
- Students:
  - Can read only own attendance rows.
  - Cannot insert/update attendance directly.
- Doctors:
  - Can read only sessions where `doctor_id = auth.uid()`.
  - Can read attendance only for their sessions.
- Owner:
  - Full read access.
  - Writes mediated through RPC.

## 7) Auditability
- All high-risk events are logged in `system_logs`:
  - Failed logins
  - Attendance attempts
  - Rate-limit hits
  - Geofence failures
  - Role changes
  - RPC failures

## 8) Operational Requirements
- Required runtime secrets:
  - `SERVER_SECRET`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - DB setting `app.settings.server_secret` for RPC-side hash validation.
- Monitoring:
  - Alert on critical logs and repeated warnings.
  - Track index health for write-heavy tables (`attendance`, `system_logs`).
