import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LocateFixed, QrCode, RotateCw, Timer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import { supabase } from "@/lib/supabaseClient";
import { useAttendanceAuth } from "../context/AttendanceAuthContext";
import { useRotatingHash } from "../hooks/useRotatingHash";

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface SubjectOption {
  id: string;
  name: string;
}

interface CreatedSession {
  id: string;
  subjectId: string;
  subjectName: string;
  startsAt: string;
  endsAt: string;
}

interface DoctorSessionControlPanelProps {
  onSessionCreated?: () => void;
}

const startSessionButtonLabel = "\u0628\u062f\u0621 \u0627\u0644\u062c\u0644\u0633\u0629";
const refreshLocationButtonLabel = "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0648\u0642\u0639";
const sessionStartedTitle = "\u062a\u0645 \u0628\u062f\u0621 \u0627\u0644\u062c\u0644\u0633\u0629";
const sessionStartedDescription =
  "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062c\u0644\u0633\u0629 \u0648\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u062a\u0648\u0643\u0646 \u0627\u0644\u062f\u064a\u0646\u0627\u0645\u064a\u0643\u064a.";

const formatCountdown = (seconds: number | null): string => {
  if (seconds === null) {
    return "--:--";
  }

  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainder
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
};

const normalizeSessionResponse = (
  value: Record<string, unknown>,
  fallbackStartTime: string,
  fallbackEndTime: string,
): CreatedSession | null => {
  const id = typeof value.id === "string" ? value.id : null;
  const subjectId = typeof value.subject_id === "string" ? value.subject_id : null;

  if (!id || !subjectId) {
    return null;
  }

  const startsAt =
    typeof value.start_time === "string"
      ? value.start_time
      : typeof value.starts_at === "string"
        ? value.starts_at
        : fallbackStartTime;

  const endsAt =
    typeof value.end_time === "string"
      ? value.end_time
      : typeof value.ends_at === "string"
        ? value.ends_at
        : fallbackEndTime;

  return {
    id,
    subjectId,
    subjectName: "",
    startsAt,
    endsAt,
  };
};

export const DoctorSessionControlPanel = ({ onSessionCreated }: DoctorSessionControlPanelProps) => {
  const { toast } = useToast();
  const { user } = useAttendanceAuth();

  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  const [radiusMeters, setRadiusMeters] = useState("120");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);

  const subjectNameById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject.name]));
  }, [subjects]);

  const {
    rotatingHash,
    dynamicCode,
    secondsUntilNextRotation,
    secondsUntilSessionExpiry,
    isRefreshing,
    error: rotatingHashError,
    refreshHash,
  } = useRotatingHash({
    sessionId: createdSession?.id ?? null,
    sessionEndsAt: createdSession?.endsAt ?? null,
  });

  const resolveCurrentLocation = useCallback(async (): Promise<Coordinates> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      throw new Error("Geolocation is not supported on this device.");
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
            reject(new Error("Location permission is required to start the session."));
            return;
          }

          if (error.code === error.TIMEOUT) {
            reject(new Error("Location request timed out. Please retry."));
            return;
          }

          reject(new Error("Failed to retrieve current location."));
        },
        {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 15_000,
        },
      );
    });
  }, []);

  const refreshLocation = useCallback(async (): Promise<Coordinates | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unsupported");
      setLocationError("Geolocation is not supported on this device.");
      return null;
    }

    setLocationStatus("requesting");
    setLocationError(null);

    try {
      const nextCoordinates = await resolveCurrentLocation();
      setCoordinates(nextCoordinates);
      setLocationStatus("granted");
      return nextCoordinates;
    } catch (error) {
      setCoordinates(null);
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Unable to access your current location.";

      if (message.toLowerCase().includes("not supported")) {
        setLocationStatus("unsupported");
      } else {
        setLocationStatus("denied");
      }
      setLocationError(message);
      return null;
    }
  }, [resolveCurrentLocation]);

  useEffect(() => {
    const loadDoctorSubjects = async () => {
      setIsLoadingSubjects(true);

      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        setSubjects([]);
        setIsLoadingSubjects(false);
        return;
      }

      const nextSubjects = (data ?? [])
        .map((row) => ({
          id: typeof row.id === "string" ? row.id : "",
          name: typeof row.name === "string" ? row.name : "Unnamed Subject",
        }))
        .filter((subject) => subject.id);

      setSubjects(nextSubjects);

      setSubjectId((current) => current || nextSubjects[0]?.id || "");

      setIsLoadingSubjects(false);
    };

    void loadDoctorSubjects();
  }, []);

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  const handleStartSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Session start blocked",
        description: "Doctor authentication is required.",
      });
      return;
    }

    const normalizedSubjectId = subjectId.trim();
    if (!normalizedSubjectId) {
      toast({
        variant: "destructive",
        title: "Session start blocked",
        description: "Subject is required.",
      });
      return;
    }

    const parsedRadius = Math.round(Number(radiusMeters));
    const parsedDuration = Math.round(Number(durationMinutes));

    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid radius",
        description: "Radius must be a positive number.",
      });
      return;
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid duration",
        description: "Duration must be a positive number of minutes.",
      });
      return;
    }

    setIsStartingSession(true);

    const liveCoordinates = await refreshLocation();
    if (!liveCoordinates) {
      setIsStartingSession(false);
      toast({
        variant: "destructive",
        title: "Location required",
        description: "Unable to start session without live geolocation.",
      });
      return;
    }

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + parsedDuration * 60_000).toISOString();

    const basePayload = {
      subject_id: normalizedSubjectId,
      doctor_id: user.id,
      latitude: liveCoordinates.latitude,
      longitude: liveCoordinates.longitude,
      geofence_radius_meters: parsedRadius,
      status: "active" as const,
    };

    let createdRow: Record<string, unknown> | null = null;
    let insertErrorMessage: string | null = null;

    try {
      const { data: startTimeData, error: startTimeError } = await supabase
        .from("sessions")
        .insert({
          ...basePayload,
          start_time: startTime,
          end_time: endTime,
        })
        .select("*")
        .single();

      if (startTimeError) {
        const { data: startsAtData, error: startsAtError } = await supabase
          .from("sessions")
          .insert({
            ...basePayload,
            starts_at: startTime,
            ends_at: endTime,
          })
          .select("*")
          .single();

        if (startsAtError) {
          insertErrorMessage = startsAtError.message || startTimeError.message || "Failed to create session.";
        } else if (startsAtData && typeof startsAtData === "object") {
          createdRow = startsAtData as Record<string, unknown>;
        }
      } else if (startTimeData && typeof startTimeData === "object") {
        createdRow = startTimeData as Record<string, unknown>;
      }

      if (!createdRow) {
        throw new Error(insertErrorMessage || "Failed to create session.");
      }

      const normalizedSession = normalizeSessionResponse(createdRow, startTime, endTime);
      if (!normalizedSession) {
        throw new Error("Session created with incomplete response.");
      }

      normalizedSession.subjectName =
        subjectNameById.get(normalizedSession.subjectId) || "Unknown Subject";

      setCreatedSession(normalizedSession);
      onSessionCreated?.();

      toast({
        title: sessionStartedTitle,
        description: sessionStartedDescription,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Unable to start session right now.";
      toast({
        variant: "destructive",
        title: "Session start failed",
        description: message,
      });
    } finally {
      setIsStartingSession(false);
    }
  };

  const qrPayload =
    createdSession && rotatingHash
      ? JSON.stringify({
          session_id: createdSession.id,
          rotating_token: rotatingHash,
        })
      : "";

  return (
    <Card className="overflow-hidden border-primary/25 bg-card/85">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Start Session</CardTitle>
        <CardDescription>Detect location, set radius and duration, then launch an active session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleStartSession} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="doctor-subject-id">Subject</Label>
            {subjects.length > 0 ? (
              <Select value={subjectId} onValueChange={setSubjectId} disabled={isLoadingSubjects}>
                <SelectTrigger id="doctor-subject-id">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="doctor-subject-id"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                placeholder="Enter subject UUID"
                required
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="session-radius">Radius (meters)</Label>
              <Input
                id="session-radius"
                type="number"
                min={1}
                value={radiusMeters}
                onChange={(event) => setRadiusMeters(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-duration">Session duration (minutes)</Label>
              <Input
                id="session-duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Doctor Geolocation</p>
                {locationStatus === "granted" && coordinates ? (
                  <p className="text-xs text-muted-foreground">
                    Lat: {coordinates.latitude.toFixed(6)} | Lon: {coordinates.longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {locationError ?? "Location is required to start the session."}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshLocation()}
                disabled={locationStatus === "requesting"}
              >
                {locationStatus === "requesting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                {refreshLocationButtonLabel}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={isStartingSession}>
            {isStartingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
            {startSessionButtonLabel}
          </Button>
        </form>

        {createdSession ? (
          <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Live Session</p>
                <p className="text-xs text-muted-foreground">
                  {createdSession.subjectName} | {createdSession.id}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => void refreshHash()} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                Refresh Token
              </Button>
            </div>

            {rotatingHashError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {rotatingHashError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/25 bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">6 Digit Dynamic Code</p>
                  <p className="mt-1 font-mono text-3xl font-bold tracking-[0.4em] text-primary">{dynamicCode}</p>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <p className="inline-flex items-center gap-2">
                    <RotateCw className="h-3.5 w-3.5" />
                    Token refresh in {formatCountdown(secondsUntilNextRotation)}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5" />
                    Session expires in {formatCountdown(secondsUntilSessionExpiry)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-primary/25 bg-background/80 p-3">
                <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <QrCode className="h-3.5 w-3.5" />
                  Session QR
                </p>
                {qrPayload ? (
                  <QRCodeSVG
                    value={qrPayload}
                    size={136}
                    level="M"
                    includeMargin
                    className="rounded bg-white p-2"
                  />
                ) : (
                  <div className="flex h-[136px] w-[136px] items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
                    Waiting for token
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

