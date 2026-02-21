import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceRole } from "../types";

interface ProtectedRouteProps {
  currentRole: AttendanceRole;
  allowedRoles: AttendanceRole[];
  children: ReactNode;
}

const formatRoles = (roles: AttendanceRole[]) => roles.map((role) => role.toUpperCase()).join(", ");

export const ProtectedRoute = ({ currentRole, allowedRoles, children }: ProtectedRouteProps) => {
  if (allowedRoles.includes(currentRole)) {
    return <>{children}</>;
  }

  return (
    <Card className="border-destructive/40 bg-card/80">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          Access Restricted
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This dashboard is limited to roles: <span className="text-foreground">{formatRoles(allowedRoles)}</span>.
      </CardContent>
    </Card>
  );
};
