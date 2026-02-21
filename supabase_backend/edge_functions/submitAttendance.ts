import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const WINDOW_SECONDS = 30;
const RATE_LIMIT_PER_MINUTE = 20;
const encoder = new TextEncoder();

type SubmitAttendancePayload = {
  session_id: string;
  rotating_hash: string;
  time_window: number;
  latitude: number;
  longitude: number;
  device_hash: string;
  request_nonce: string;
};

const createJsonResponse = (status: number, payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};

const getClientIp = (request: Request): string | null => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
};

const computeHmacSha256 = async (payload: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((value) => value.toString(16).padStart(2, "0")).join("");
};

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const isValidPayload = (payload: SubmitAttendancePayload): boolean => {
  return (
    typeof payload.session_id === "string" &&
    typeof payload.rotating_hash === "string" &&
    typeof payload.time_window === "number" &&
    typeof payload.latitude === "number" &&
    typeof payload.longitude === "number" &&
    typeof payload.device_hash === "string" &&
    typeof payload.request_nonce === "string"
  );
};

serve(async (request) => {
  if (request.method !== "POST") {
    return createJsonResponse(405, { error: "Method not allowed. Use POST." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const serverSecret = Deno.env.get("SERVER_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !serverSecret) {
    return createJsonResponse(500, {
      error: "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SERVER_SECRET are required.",
    });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return createJsonResponse(401, { error: "Missing bearer token." });
  }

  const jwt = authorization.replace("Bearer ", "").trim();
  const ipAddress = getClientIp(request);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: SubmitAttendancePayload;
  try {
    body = await request.json();
  } catch {
    return createJsonResponse(400, { error: "Invalid JSON body." });
  }

  if (!isValidPayload(body)) {
    return createJsonResponse(400, { error: "Invalid payload fields." });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  if (authError || !authData.user) {
    return createJsonResponse(401, { error: "Invalid JWT token." });
  }

  const userId = authData.user.id;
  const now = new Date();
  const nowIso = now.toISOString();
  const timeWindowNow = Math.floor(now.getTime() / 1000 / WINDOW_SECONDS);

  const { count: recentAttempts, error: rateLimitError } = await supabaseAdmin
    .from("system_logs")
    .select("id", { head: true, count: "exact" })
    .eq("action", "attendance_submit_attempt")
    .or(`ip_address.eq.${ipAddress ?? "null"},device_hash.eq.${body.device_hash}`)
    .gte("created_at", new Date(now.getTime() - 60 * 1000).toISOString());

  if (rateLimitError) {
    return createJsonResponse(500, { error: "Rate limit pre-check failed.", details: rateLimitError.message });
  }

  if ((recentAttempts ?? 0) >= RATE_LIMIT_PER_MINUTE) {
    await supabaseAdmin.from("system_logs").insert({
      actor_user_id: userId,
      action: "attendance_rate_limit_hit_edge",
      severity: "critical",
      metadata: { recent_attempts: recentAttempts },
      ip_address: ipAddress,
      device_hash: body.device_hash,
    });

    return createJsonResponse(429, { error: "Rate limit exceeded. Try again later." });
  }

  await supabaseAdmin.from("system_logs").insert({
    actor_user_id: userId,
    action: "attendance_submit_attempt",
    severity: "info",
    metadata: { session_id: body.session_id, time_window: body.time_window, edge_validated_at: nowIso },
    ip_address: ipAddress,
    device_hash: body.device_hash,
  });

  const { data: sessionData, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("id, starts_at, ends_at, status, latitude, longitude, geofence_radius_meters")
    .eq("id", body.session_id)
    .maybeSingle();

  if (sessionError || !sessionData) {
    return createJsonResponse(404, { error: "Session not found." });
  }

  const startsAt = new Date(sessionData.starts_at);
  const endsAt = new Date(sessionData.ends_at);

  if (now < startsAt) {
    return createJsonResponse(400, { error: "Session has not started." });
  }

  if (now > endsAt) {
    return createJsonResponse(400, { error: "Session has ended." });
  }

  if (sessionData.status === "ended" || sessionData.status === "cancelled") {
    return createJsonResponse(400, { error: "Session is not active." });
  }

  if (Math.abs(body.time_window - timeWindowNow) > 1) {
    return createJsonResponse(400, { error: "Invalid rotating hash time window." });
  }

  const expectedHash = await computeHmacSha256(`${body.session_id}:${body.time_window}`, serverSecret);
  if (expectedHash !== body.rotating_hash) {
    return createJsonResponse(401, { error: "Rotating hash mismatch." });
  }

  const distanceMeters = haversineMeters(
    body.latitude,
    body.longitude,
    Number(sessionData.latitude),
    Number(sessionData.longitude),
  );

  if (distanceMeters > Number(sessionData.geofence_radius_meters)) {
    await supabaseAdmin.from("system_logs").insert({
      actor_user_id: userId,
      action: "attendance_geo_validation_failed",
      severity: "warning",
      metadata: {
        session_id: body.session_id,
        distance_meters: distanceMeters,
        allowed_radius_meters: sessionData.geofence_radius_meters,
      },
      ip_address: ipAddress,
      device_hash: body.device_hash,
    });
    return createJsonResponse(403, { error: "Outside allowed geofence." });
  }

  const { data: replayData, error: replayError } = await supabaseAdmin
    .from("attendance")
    .select("id")
    .eq("request_nonce", body.request_nonce)
    .maybeSingle();

  if (replayError) {
    return createJsonResponse(500, { error: "Replay check failed.", details: replayError.message });
  }

  if (replayData) {
    return createJsonResponse(409, { error: "Replay detected: request nonce already used." });
  }

  const { data: duplicateData, error: duplicateError } = await supabaseAdmin
    .from("attendance")
    .select("id")
    .eq("session_id", body.session_id)
    .eq("student_id", userId)
    .maybeSingle();

  if (duplicateError) {
    return createJsonResponse(500, { error: "Duplicate check failed.", details: duplicateError.message });
  }

  if (duplicateData) {
    return createJsonResponse(409, { error: "Duplicate attendance submission for this session." });
  }

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("rpc_submit_attendance", {
    p_session_id: body.session_id,
    p_rotating_hash: body.rotating_hash,
    p_time_window: body.time_window,
    p_latitude: body.latitude,
    p_longitude: body.longitude,
    p_request_nonce: body.request_nonce,
    p_ip_address: ipAddress,
    p_device_hash: body.device_hash,
    p_student_id: userId,
  });

  if (rpcError) {
    await supabaseAdmin.from("system_logs").insert({
      actor_user_id: userId,
      action: "attendance_submit_failed_edge",
      severity: "warning",
      metadata: { session_id: body.session_id, error: rpcError.message },
      ip_address: ipAddress,
      device_hash: body.device_hash,
    });
    return createJsonResponse(400, { error: "RPC submission failed.", details: rpcError.message });
  }

  return createJsonResponse(200, {
    success: true,
    data: Array.isArray(rpcData) ? rpcData[0] : rpcData,
    distance_meters: Number(distanceMeters.toFixed(2)),
  });
});
