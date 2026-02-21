import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttendanceRole } from "../hooks/useAttendanceRole";
import type { AttendanceRole } from "../types";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DoctorDashboard } from "./DoctorDashboard";
import { OwnerDashboard } from "./OwnerDashboard";
import { StudentDashboard } from "./StudentDashboard";

const roleLabels: Record<AttendanceRole, string> = {
  owner: "Owner",
  doctor: "Doctor",
  student: "Student",
};

const AttendancePage = () => {
  const { role, setRole } = useAttendanceRole("student");

  return (
    <Layout>
      <section className="section-container py-10 md:py-14">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Attendance Module
            </p>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Attendance Center</h1>
            <p className="max-w-2xl text-muted-foreground">
              Role-aware attendance interface with isolated dashboards, analytics, rotating session hashes, and
              export-action triggers.
            </p>
          </div>

          <Card className="border-primary/20 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Role Isolation</CardTitle>
              <CardDescription>Select a role to preview the corresponding isolated dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={role} onValueChange={(value) => setRole(value as AttendanceRole)} className="w-full">
                <TabsList className="grid h-auto w-full max-w-lg grid-cols-3 gap-2 bg-transparent p-0">
                  <TabsTrigger value="owner" className="rounded-md border border-border bg-card">
                    {roleLabels.owner}
                  </TabsTrigger>
                  <TabsTrigger value="doctor" className="rounded-md border border-border bg-card">
                    {roleLabels.doctor}
                  </TabsTrigger>
                  <TabsTrigger value="student" className="rounded-md border border-border bg-card">
                    {roleLabels.student}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="owner" className="mt-6">
                  <ProtectedRoute currentRole={role} allowedRoles={["owner"]}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                </TabsContent>

                <TabsContent value="doctor" className="mt-6">
                  <ProtectedRoute currentRole={role} allowedRoles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                </TabsContent>

                <TabsContent value="student" className="mt-6">
                  <ProtectedRoute currentRole={role} allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default AttendancePage;
