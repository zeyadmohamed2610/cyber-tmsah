import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { attendanceService } from "../services/attendanceService";
import type { SessionSummary } from "../types";
import { getTimeWindow } from "../utils/rotatingSession";

interface AttendanceSubmissionFormProps {
  sessions: SessionSummary[];
}

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

interface Coordinates {
  latitude: number;
  longitude: number;
}

const classifyDeviceClass = (userAgent: string): "mobile" | "tablet" | "desktop" | "unknown" => {
  const normalizedAgent = userAgent.toLowerCase();

  if (!normalizedAgent.trim()) {
    return "unknown";
  }

  if (
    normalizedAgent.includes("ipad") ||
    normalizedAgent.includes("tablet") ||
    normalizedAgent.includes("playbook") ||
    (normalizedAgent.includes("android") && !normalizedAgent.includes("mobile"))
  ) {
    return "tablet";
  }

  if (
    normalizedAgent.includes("mobile") ||
    normalizedAgent.includes("iphone") ||
    normalizedAgent.includes("ipod") ||
    normalizedAgent.includes("android")
  ) {
    return "mobile";
  }

  return "desktop";
};

const buildDeviceHash = (): string => {
  if (typeof window === "undefined") {
    return "server-render";
  }

  const fingerprint = `${window.navigator.userAgent}|${window.navigator.language}|${window.navigator.platform}`;
  return btoa(fingerprint).slice(0, 32);
};

const safeUuid = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fallback-${Date.now()}`;
};

const getDeviceMemory = (): number | null => {
  if (typeof navigator === "undefined") {
    return null;
  }

  const typedNavigator = navigator as Navigator & { deviceMemory?: number };
  return typeof typedNavigator.deviceMemory === "number" && Number.isFinite(typedNavigator.deviceMemory)
    ? typedNavigator.deviceMemory
    : null;
};

type GeolocationFailure = {
  status: Exclude<LocationStatus, "idle" | "requesting" | "granted">;
  message: string;
};

export const AttendanceSubmissionForm = ({ sessions }: AttendanceSubmissionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [rotatingHash, setRotatingHash] = useState("");
  const [deviceHash] = useState(buildDeviceHash());
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const deviceMemory = useMemo(() => getDeviceMemory(), []);
  const deviceClass = useMemo(() => classifyDeviceClass(userAgent), [userAgent]);

  const activeSessionOptions = useMemo(
    () => sessions.filter((session) => session.status === "active" || session.status === "scheduled"),
    [sessions],
  );
  const hasSelectableSessions = activeSessionOptions.length > 0;

  useEffect(() => {
    if (!sessionId && hasSelectableSessions) {
      setSessionId(activeSessionOptions[0].id);
      return;
    }

    if (!hasSelectableSessions && sessionId) {
      setSessionId("");
    }
  }, [activeSessionOptions, hasSelectableSessions, sessionId]);

  const requestLocation = useCallback(async (): Promise<Coordinates> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      throw {
        status: "unsupported",
        message: "Geolocation is not supported on this device.",
      } as GeolocationFailure;
    }

    return new Promise<Coordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject({
              status: "denied",
              message: "Location permission is required before submitting attendance.",
            } as GeolocationFailure);
            return;
          }

          if (error.code === error.TIMEOUT) {
            reject({
              status: "denied",
              message: "Location request timed out. Please retry.",
            } as GeolocationFailure);
            return;
          }

          reject({
            status: "denied",
            message: "Failed to retrieve your current location.",
          } as GeolocationFailure);
        },
        {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 15_000,
        },
      );
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionId || !rotatingHash) {
      toast({
        variant: "destructive",
        title: "Submission blocked",
        description: "Session ID and rotating hash are required.",
      });
      return;
    }

    setIsSubmitting(true);

    setLocationStatus("requesting");
    setLocationError(null);

    let liveCoordinates: Coordinates;

    try {
      liveCoordinates = await requestLocation();
      setCoordinates(liveCoordinates);
      setLocationStatus("granted");
    } catch (error) {
      setIsSubmitting(false);

      const geolocationError = error as Partial<GeolocationFailure>;
      const nextStatus = geolocationError.status ?? "denied";
      const message =
        typeof geolocationError.message === "string" && geolocationError.message.trim()
          ? geolocationError.message
          : "Location permission is required before submitting attendance.";

      setCoordinates(null);
      setLocationStatus(nextStatus);
      setLocationError(message);

      toast({
        variant: "destructive",
        title: "Location required",
        description: message,
      });
      return;
    }

    const result = await attendanceService.submitAttendance({
      sessionId,
      rotatingHash,
      latitude: liveCoordinates.latitude,
      longitude: liveCoordinates.longitude,
      deviceHash,
      deviceClass,
      requestNonce: safeUuid(),
      timeWindow: getTimeWindow(),
      userAgent: userAgent || "unknown-user-agent",
      deviceMemory,
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Attendance submission failed",
        description: result.error,
      });
    } else {
      toast({
        title: "Attendance submitted",
        description: "Attendance entry has been queued successfully.",
      });
      setRotatingHash("");
    }

    setIsSubmitting(false);
  };

  const canSubmit = hasSelectableSessions;

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg">Submit Attendance</CardTitle>
        <CardDescription>Backend validation handles geofence, nonce, and device policy checks.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="session-id">Session</Label>
            <Select value={sessionId} onValueChange={setSessionId} disabled={!hasSelectableSessions}>
              <SelectTrigger id="session-id">
                <SelectValue placeholder="Select active session" />
              </SelectTrigger>
              <SelectContent>
                {activeSessionOptions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.subjectName} ({session.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasSelectableSessions ? (
              <p className="text-xs text-muted-foreground">
                No scheduled or active sessions are currently available for attendance submission.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rotating-hash">Rotating Hash</Label>
            <Input
              id="rotating-hash"
              value={rotatingHash}
              onChange={(event) => setRotatingHash(event.target.value)}
              placeholder="Enter current rotating hash"
              required
            />
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Live Location Capture</p>
              <p className="text-xs text-muted-foreground">
                Geolocation is requested at submit time. Submission is refused if permission is denied.
              </p>
              {locationStatus === "granted" && coordinates ? (
                <p className="text-xs text-muted-foreground">
                  Last capture: {coordinates.latitude.toFixed(6)} | {coordinates.longitude.toFixed(6)}
                </p>
              ) : null}
              {locationError ? <p className="text-xs text-destructive">{locationError}</p> : null}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground">
            Device metadata is sent automatically for backend enforcement.
            <div>User-Agent: {userAgent || "unknown-user-agent"}</div>
            <div>Device memory: {deviceMemory ?? "not-available"} GB</div>
            <div>Device class: {deviceClass}</div>
            <div>Device hash: {deviceHash}</div>
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
