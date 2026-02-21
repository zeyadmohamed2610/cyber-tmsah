import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceRecord } from "../../types";
import "./chartRegistry";

interface AttendanceStatusChartProps {
  records: AttendanceRecord[];
}

export const AttendanceStatusChart = ({ records }: AttendanceStatusChartProps) => {
  const chartData = useMemo(() => {
    const present = records.filter((row) => row.status === "present").length;
    const late = records.filter((row) => row.status === "late").length;
    const absent = records.filter((row) => row.status === "absent").length;

    return {
      labels: ["Present", "Late", "Absent"],
      datasets: [
        {
          label: "Submissions",
          data: [present, late, absent],
          backgroundColor: ["rgba(45, 212, 191, 0.75)", "rgba(245, 158, 11, 0.75)", "rgba(239, 68, 68, 0.75)"],
          borderColor: ["#2DD4BF", "#F59E0B", "#EF4444"],
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }, [records]);

  const hasData = records.length > 0;

  return (
    <Card className="bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {hasData ? (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  ticks: { color: "#94A3B8" },
                  grid: { color: "rgba(148, 163, 184, 0.1)" },
                },
                y: {
                  ticks: { color: "#94A3B8" },
                  grid: { color: "rgba(148, 163, 184, 0.1)" },
                  beginAtZero: true,
                },
              },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Status analytics will appear after backend integration.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
