import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "doctor" | "student";
};

// Helper to add CORS headers for Edge Functions
const createJsonResponse = (
  status: number,
  payload: Record<string, unknown>,
  origin: string | null
) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
  return new Response(JSON.stringify(payload), { status, headers });
};

const isValidPayload = (payload: unknown): payload is CreateUserPayload => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  const p = payload as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    typeof p.email === "string" &&
    p.email.trim().length > 0 &&
    typeof p.password === "string" &&
    p.password.length >= 6 &&
    (p.role === "doctor" || p.role === "student")
  );
};

serve(async (request) => {
  const origin = request.headers.get("origin") ?? null;
  if (request.method === "OPTIONS") {
    // Preflight CORS request
    const respHeaders = new Headers({
      "Access-Control-Allow-Origin": origin ?? "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    });
    return new Response(null, { status: 204, headers: respHeaders });
  }
  if (request.method !== "POST") {
    return createJsonResponse(405, { error: "Method not allowed. Use POST." }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return createJsonResponse(500, {
      error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return createJsonResponse(401, { error: "Missing bearer token." }, origin);
  }

  const jwt = authorization.replace("Bearer ", "").trim();

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  if (authError || !authData.user) {
    return createJsonResponse(401, { error: "Invalid JWT token." }, origin);
  }

  const callerId = authData.user.id;

  const { data: callerData, error: callerError } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", callerId)
    .maybeSingle();

  if (callerError) {
    return createJsonResponse(500, { error: "Failed to verify caller role.", details: callerError.message });
  }

  if (!callerData || callerData.role !== "owner") {
    return createJsonResponse(403, { error: "Only owners can create new users." }, origin);
  }

  let body: CreateUserPayload;
  try {
    body = await request.json();
  } catch {
    return createJsonResponse(400, { error: "Invalid JSON body." }, origin);
  }

  if (!isValidPayload(body)) {
    return createJsonResponse(400, { error: "Invalid payload. Required: name (string), email (string), password (min 6 chars), role (doctor|student)." }, origin);
  }

  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", body.email.trim().toLowerCase())
    .maybeSingle();

  if (existingUser) {
    return createJsonResponse(409, { error: "A user with this email already exists." }, origin);
  }

  const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email.trim().toLowerCase(),
    password: body.password,
    email_confirm: true,
  });

  if (createError) {
    return createJsonResponse(500, { error: "Failed to create auth user.", details: createError.message }, origin);
  }

  if (!newAuthUser.user) {
    return createJsonResponse(500, { error: "Failed to create auth user. No user returned." }, origin);
  }

  const newUserId = newAuthUser.user.id;

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    id: newUserId,
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    role: body.role,
  });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return createJsonResponse(500, { error: "Failed to create user record.", details: insertError.message }, origin);
  }

  await supabaseAdmin.from("system_logs").insert({
    actor_user_id: callerId,
    action: "user_created_by_owner",
    severity: "info",
    metadata: {
      new_user_id: newUserId,
      new_user_email: body.email.trim().toLowerCase(),
      new_user_role: body.role,
    },
  });

  return createJsonResponse(201, {
    success: true,
    user: {
      id: newUserId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role,
    },
  }, origin);
});
