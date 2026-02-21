import { Activity, BookOpenCheck, Clock3, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { ExportButtons } from "../components/ExportButtons";
import { StatCard } from "../components/StatCard";
import { AttendanceStatusChart } from "../components/charts/AttendanceStatusChart";
import { AttendanceSubjectChart } from "../components/charts/AttendanceSubjectChart";
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

export const OwnerDashboard = () => {
  const { loading, error, metrics, records, trendPoints, subjectMetrics } = useAttendanceDashboardData("owner");

  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      id: "student",
      header: "Student",
      cell: (row) => row.studentName || row.studentId,
    },
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
          title="Total Sessions"
          value={metrics.totalSessions}
          description="Sessions across all subjects"
          icon={BookOpenCheck}
        />
        <StatCard
          title="Total Students"
          value={metrics.totalStudents}
          description="Users with student role"
          icon={Users}
        />
        <StatCard
          title="Active Sessions"
          value={metrics.activeSessions}
          description="Live or ongoing sessions"
          icon={Clock3}
        />
        <StatCard
          title="Attendance Rate"
          value={`${metrics.attendanceRate.toFixed(1)}%`}
          description="Global attendance ratio"
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendanceTrendChart points={trendPoints} />
        <AttendanceStatusChart records={records} />
      </div>

      <AttendanceSubjectChart metrics={subjectMetrics} />

      <DataTable
        title="Recent Attendance Events"
        caption={loading ? "Loading..." : "Latest attendance submissions for governance visibility."}
        columns={columns}
        rows={records}
        getRowId={(row) => row.id}
        emptyMessage="No attendance events available."
      />

      <ExportButtons role="owner" />
    </div>
  );
};
