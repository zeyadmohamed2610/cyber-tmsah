import { Activity, BookOpen, CalendarClock, ClipboardCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { AttendanceSubmissionForm } from "../components/AttendanceSubmissionForm";
import { ExportButtons } from "../components/ExportButtons";
import { RotatingSessionDisplay } from "../components/RotatingSessionDisplay";
import { StatCard } from "../components/StatCard";
import { AttendanceTrendChart } from "../components/charts/AttendanceTrendChart";
import { useAttendanceDashboardData } from "../hooks/useAttendanceDashboardData";
import type { AttendanceRecord } from "../types";
import { formatDateTime } from "../utils/rotatingSession";

const getStatusVariant = (status: AttendanceRecord["status"]) => {
  if (status === "present") {
    return "default";
  }
  if (status === "late") {
    return "secondary";
  }
  return "destructive";
};

export const StudentDashboard = () => {
  const { loading, error, metrics, records, sessions, trendPoints } = useAttendanceDashboardData("student");

  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      id: "subject",
      header: "Subject",
      cell: (row) => row.subjectName || "N/A",
    },
    {
      id: "submitted-at",
      header: "Submitted At",
      cell: (row) => formatDateTime(row.submittedAt),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status.toUpperCase()}</Badge>,
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
          description="Sessions available to this student"
          icon={BookOpen}
        />
        <StatCard
          title="Active Sessions"
          value={metrics.activeSessions}
          description="Sessions currently accepting attendance"
          icon={CalendarClock}
        />
        <StatCard
          title="Attendance Rate"
          value={`${metrics.attendanceRate.toFixed(1)}%`}
          description="Student attendance ratio"
          icon={Activity}
        />
        <StatCard
          title="Pending Submissions"
          value={metrics.pendingSubmissions}
          description="Attendance to submit"
          icon={ClipboardCheck}
        />
      </div>

      <RotatingSessionDisplay sessions={sessions} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendanceSubmissionForm sessions={sessions} />
        <AttendanceTrendChart points={trendPoints} />
      </div>

      <DataTable
        title="My Attendance History"
        caption={loading ? "Loading..." : "You can only view your own attendance records."}
        columns={columns}
        rows={records}
        getRowId={(row) => row.id}
        emptyMessage="No attendance records found."
      />

      <ExportButtons role="student" />
    </div>
  );
};
