BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subjects FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;

GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.sessions TO authenticated;
GRANT SELECT ON public.attendance TO authenticated;
GRANT SELECT ON public.system_logs TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subjects FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sessions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.attendance FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.system_logs FROM anon, authenticated;

DROP POLICY IF EXISTS users_select_self_or_owner ON public.users;
CREATE POLICY users_select_self_or_owner
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.current_app_role() = 'owner'
);

DROP POLICY IF EXISTS subjects_select_by_role ON public.subjects;
CREATE POLICY subjects_select_by_role
ON public.subjects
FOR SELECT
TO authenticated
USING (
  public.current_app_role() = 'owner'
  OR (
    public.current_app_role() = 'doctor'
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.subject_id = subjects.id
      AND s.doctor_id = auth.uid()
    )
  )
  OR public.current_app_role() = 'student'
);

DROP POLICY IF EXISTS sessions_owner_select_all ON public.sessions;
CREATE POLICY sessions_owner_select_all
ON public.sessions
FOR SELECT
TO authenticated
USING (public.current_app_role() = 'owner');

DROP POLICY IF EXISTS sessions_doctor_select_own ON public.sessions;
CREATE POLICY sessions_doctor_select_own
ON public.sessions
FOR SELECT
TO authenticated
USING (
  public.current_app_role() = 'doctor'
  AND doctor_id = auth.uid()
);

DROP POLICY IF EXISTS sessions_student_select_open ON public.sessions;
CREATE POLICY sessions_student_select_open
ON public.sessions
FOR SELECT
TO authenticated
USING (
  public.current_app_role() = 'student'
  AND status IN ('scheduled', 'active')
);

DROP POLICY IF EXISTS attendance_owner_select_all ON public.attendance;
CREATE POLICY attendance_owner_select_all
ON public.attendance
FOR SELECT
TO authenticated
USING (public.current_app_role() = 'owner');

DROP POLICY IF EXISTS attendance_student_select_own ON public.attendance;
CREATE POLICY attendance_student_select_own
ON public.attendance
FOR SELECT
TO authenticated
USING (
  public.current_app_role() = 'student'
  AND student_id = auth.uid()
);

DROP POLICY IF EXISTS attendance_doctor_select_own_sessions ON public.attendance;
CREATE POLICY attendance_doctor_select_own_sessions
ON public.attendance
FOR SELECT
TO authenticated
USING (
  public.current_app_role() = 'doctor'
  AND EXISTS (
    SELECT 1
    FROM public.sessions s
    WHERE s.id = attendance.session_id
    AND s.doctor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS system_logs_owner_select_all ON public.system_logs;
CREATE POLICY system_logs_owner_select_all
ON public.system_logs
FOR SELECT
TO authenticated
USING (public.current_app_role() = 'owner');

DROP POLICY IF EXISTS system_logs_actor_select_self ON public.system_logs;
CREATE POLICY system_logs_actor_select_self
ON public.system_logs
FOR SELECT
TO authenticated
USING (
  actor_user_id = auth.uid()
);

COMMIT;
