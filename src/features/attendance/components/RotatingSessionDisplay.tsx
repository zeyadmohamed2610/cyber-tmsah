import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionSummary } from "../types";
import { formatDateTime, generateVisualRotatingHash, getSecondsUntilNextWindow } from "../utils/rotatingSession";

interface RotatingSessionDisplayProps {
  sessions: SessionSummary[];
}

export const RotatingSessionDisplay = ({ sessions }: RotatingSessionDisplayProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(getSecondsUntilNextWindow());

  useEffect(() => {
    if (sessions.length <= 1) {
      return;
    }

    const rotationTimer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % sessions.length);
    }, 8000);

    return () => window.clearInterval(rotationTimer);
  }, [sessions.length]);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setSecondsRemaining(getSecondsUntilNextWindow());
    }, 1000);

    return () => window.clearInterval(countdownTimer);
  }, []);

  const activeSession = sessions[activeIndex];

  const rotatingHash = useMemo(() => {
    if (!activeSession) {
      return "--------";
    }
    return generateVisualRotatingHash(activeSession.id);
  }, [activeSession, secondsRemaining]);

  if (!activeSession) {
    return (
      <Card className="bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Rotating Session Hash</CardTitle>
          <CardDescription>No active sessions found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/25 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Rotating Session Hash</CardTitle>
        <CardDescription>Visual-only rotation every 30 seconds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current Session</p>
            <p className="text-base font-semibold">{activeSession.subjectName}</p>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary">
            {activeSession.status.toUpperCase()}
          </Badge>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Rotating Hash</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.35em] text-primary">{rotatingHash}</p>
          <p className="mt-1 text-xs text-muted-foreground">Next rotation in {secondsRemaining}s</p>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <p>Starts: {formatDateTime(activeSession.startsAt)}</p>
          <p>Ends: {formatDateTime(activeSession.endsAt)}</p>
          <p>Session ID: {activeSession.id}</p>
          <p>Room: {activeSession.room || "N/A"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
