import { useMemo, useState } from "react";
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

export const AttendanceSubmissionForm = ({ sessions }: AttendanceSubmissionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [rotatingHash, setRotatingHash] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [deviceHash, setDeviceHash] = useState(buildDeviceHash());

  const hasSelectableSessions = sessions.length > 0;

  const activeSessionOptions = useMemo(() => {
    return sessions.filter((session) => session.status === "active" || session.status === "scheduled");
  }, [sessions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!sessionId || !rotatingHash || Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      toast({
        variant: "destructive",
        title: "Submission blocked",
        description: "Session ID, rotating hash, and location values are required.",
      });
      return;
    }

    setIsSubmitting(true);

    const result = await attendanceService.submitAttendance({
      sessionId,
      rotatingHash,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      deviceHash,
      requestNonce: safeUuid(),
      timeWindow: getTimeWindow(),
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

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg">Submit Attendance</CardTitle>
        <CardDescription>UI only. Backend validation is handled in Supabase RPC and edge functions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="session-id">Session</Label>
            {hasSelectableSessions ? (
              <Select value={sessionId} onValueChange={setSessionId}>
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
            ) : (
              <Input id="session-id" value={sessionId} onChange={(event) => setSessionId(event.target.value)} />
            )}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="e.g. 30.0444"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="e.g. 31.2357"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="device-hash">Device Hash</Label>
            <Input
              id="device-hash"
              value={deviceHash}
              onChange={(event) => setDeviceHash(event.target.value)}
              placeholder="Device hash"
              required
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
