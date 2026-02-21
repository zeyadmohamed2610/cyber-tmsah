import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WINDOW_SECONDS = 30;
const encoder = new TextEncoder();

const createJsonResponse = (status: number, payload: Record<string, unknown>) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
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

serve(async (request) => {
  if (request.method !== "POST") {
    return createJsonResponse(405, { error: "Method not allowed. Use POST." });
  }

  const serverSecret = Deno.env.get("SERVER_SECRET");
  if (!serverSecret) {
    return createJsonResponse(500, { error: "SERVER_SECRET is not configured." });
  }

  let body: { session_id?: string; timestamp_ms?: number };
  try {
    body = await request.json();
  } catch {
    return createJsonResponse(400, { error: "Invalid JSON body." });
  }

  const sessionId = body.session_id;
  const nowMs = typeof body.timestamp_ms === "number" ? body.timestamp_ms : Date.now();

  if (!sessionId || typeof sessionId !== "string") {
    return createJsonResponse(400, { error: "session_id is required." });
  }

  const unixSeconds = Math.floor(nowMs / 1000);
  const timeWindow = Math.floor(unixSeconds / WINDOW_SECONDS);
  const secondsRemaining = WINDOW_SECONDS - (unixSeconds % WINDOW_SECONDS);
  const hashPayload = `${sessionId}:${timeWindow}`;
  const rotatingHash = await computeHmacSha256(hashPayload, serverSecret);

  return createJsonResponse(200, {
    session_id: sessionId,
    time_window: timeWindow,
    rotating_hash: rotatingHash,
    expires_in_seconds: secondsRemaining,
  });
});
