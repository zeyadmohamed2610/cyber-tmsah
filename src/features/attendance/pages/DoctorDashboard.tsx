import { Activity, BookOpenText, Clock3, UserCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { ExportButtons } from "../components/ExportButtons";
import { RotatingSessionDisplay } from "../components/RotatingSessionDisplay";
import { StatCard } from "../components/StatCard";
import { AttendanceStatusChart } from "../components/charts/AttendanceStatusChart";
import { AttendanceTrendChart } from "../components/charts/AttendanceTrendChart";
import { useAttendanceDashboardData } from "../hooks/useAttendanceDashboardData";
import type { SessionSummary } from "../types";
import { formatDateTime } from "../utils/rotatingSession";

const getSessionBadgeVariant = (status: SessionSummary["status"]) => {
  if (status === "active") {
    return "default";
  }
  if (status === "scheduled") {
    return "secondary";
  }
  return "outline";
};

export const DoctorDashboard = () => {
  const { loading, error, metrics, records, sessions, trendPoints } = useAttendanceDashboardData("doctor");

  const columns: DataTableColumn<SessionSummary>[] = [
    {
      id: "subject",
      header: "Subject",
      cell: (row) => row.subjectName,
    },
    {
      id: "window",
      header: "Time Window",
      cell: (row) => `${formatDateTime(row.startsAt)} - ${formatDateTime(row.endsAt)}`,
    },
    {
      id: "room",
      header: "Room",
      cell: (row) => row.room || "N/A",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <Badge variant={getSessionBadgeVariant(row.status)}>{row.status.toUpperCase()}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <Alert className="border-primary/40 bg-primary/5">
          <AlertTitle>Supabase backend not connected</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Sessions"
          value={metrics.totalSessions}
          description="Sessions assigned to this doctor"
          icon={BookOpenText}
        />
        <StatCard
          title="Active Sessions"
          value={metrics.activeSessions}
          description="Live sessions right now"
          icon={Clock3}
        />
        <StatCard
          title="Pending Submissions"
          value={metrics.pendingSubmissions}
          description="Expected attendance not yet submitted"
          icon={UserCheck}
        />
        <StatCard
          title="Attendance Rate"
          value={`${metrics.attendanceRate.toFixed(1)}%`}
          description="Attendance across managed sessions"
          icon={Activity}
        />
      </div>

      <RotatingSessionDisplay sessions={sessions} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendanceTrendChart points={trendPoints} />
        <AttendanceStatusChart records={records} />
      </div>

      <DataTable
        title="Session Monitoring"
        caption={loading ? "Loading..." : "Sessions visible to this doctor only."}
        columns={columns}
        rows={sessions}
        getRowId={(row) => row.id}
        emptyMessage="No sessions found for this doctor."
      />

      <ExportButtons role="doctor" />
    </div>
  );
};
