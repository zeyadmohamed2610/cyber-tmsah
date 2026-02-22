import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UseRotatingHashParams {
  sessionId: string | null;
  sessionEndsAt?: string | null;
}

type EdgeRotatingHashResponse = {
  session_id?: string;
  time_window?: number;
  rotating_hash?: string;
  expires_in_seconds?: number;
  error?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (isObject(error) && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return "Failed to refresh rotating token.";
};

const toSixDigitCode = (rotatingHash: string | null, timeWindow: number | null): string => {
  if (!rotatingHash) {
    return "000000";
  }

  const normalizedHash = rotatingHash.replace(/[^a-fA-F0-9]/g, "").slice(0, 12);
  const seed = normalizedHash ? Number.parseInt(normalizedHash, 16) : 0;
  const safeSeed = Number.isFinite(seed) ? seed : 0;
  const safeWindow = Number.isFinite(timeWindow ?? NaN) ? (timeWindow as number) : 0;
  const code = Math.abs((safeSeed + safeWindow) % 1_000_000);

  return code.toString().padStart(6, "0");
};

const getSessionSecondsRemaining = (sessionEndsAt: string | null | undefined): number | null => {
  if (!sessionEndsAt) {
    return null;
  }

  const endsAtMs = new Date(sessionEndsAt).getTime();
  if (Number.isNaN(endsAtMs)) {
    return null;
  }

  return Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000));
};

export const useRotatingHash = ({ sessionId, sessionEndsAt }: UseRotatingHashParams) => {
  const [rotatingHash, setRotatingHash] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<number | null>(null);
  const [secondsUntilNextRotation, setSecondsUntilNextRotation] = useState(0);
  const [secondsUntilSessionExpiry, setSecondsUntilSessionExpiry] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHash = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generateRotatingHash", {
        body: { session_id: sessionId },
      });

      if (invokeError) {
        throw invokeError;
      }

      const payload = data as EdgeRotatingHashResponse;

      if (typeof payload?.error === "string" && payload.error.trim()) {
        throw new Error(payload.error.trim());
      }

      if (!payload || typeof payload.rotating_hash !== "string") {
        throw new Error("Unexpected rotating hash response shape.");
      }

      setRotatingHash(payload.rotating_hash);
      setTimeWindow(typeof payload.time_window === "number" ? payload.time_window : null);
      setSecondsUntilNextRotation(
        typeof payload.expires_in_seconds === "number" && payload.expires_in_seconds >= 0
          ? payload.expires_in_seconds
          : 30,
      );
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setRotatingHash(null);
      setTimeWindow(null);
      setSecondsUntilNextRotation(0);
      setSecondsUntilSessionExpiry(null);
      setError(null);
      return;
    }

    void refreshHash();

    const refreshTimer = window.setInterval(() => {
      void refreshHash();
    }, 30_000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [refreshHash, sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const rotationCountdownTimer = window.setInterval(() => {
      setSecondsUntilNextRotation((current) => (current > 0 ? current - 1 : 0));
    }, 1_000);

    return () => {
      window.clearInterval(rotationCountdownTimer);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setSecondsUntilSessionExpiry(null);
      return;
    }

    const updateSessionCountdown = () => {
      setSecondsUntilSessionExpiry(getSessionSecondsRemaining(sessionEndsAt));
    };

    updateSessionCountdown();

    const sessionCountdownTimer = window.setInterval(updateSessionCountdown, 1_000);
    return () => {
      window.clearInterval(sessionCountdownTimer);
    };
  }, [sessionEndsAt, sessionId]);

  const dynamicCode = useMemo(() => toSixDigitCode(rotatingHash, timeWindow), [rotatingHash, timeWindow]);

  return {
    rotatingHash,
    timeWindow,
    dynamicCode,
    secondsUntilNextRotation,
    secondsUntilSessionExpiry,
    isRefreshing,
    error,
    refreshHash,
  };
};
