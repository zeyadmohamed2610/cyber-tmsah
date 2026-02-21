import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { reportService } from "../services/reportService";
import type { AttendanceRole, ExportRequest } from "../types";

interface ExportButtonsProps {
  role: AttendanceRole;
}

const EXPORT_FORMATS: ExportRequest["format"][] = ["csv", "xlsx", "pdf"];

export const ExportButtons = ({ role }: ExportButtonsProps) => {
  const { toast } = useToast();

  const handleExport = async (format: ExportRequest["format"]) => {
    const result = await reportService.requestExport({ format, role });
    if (result.error) {
      toast({
        variant: "destructive",
        title: `Export ${format.toUpperCase()} failed`,
        description: result.error,
      });
      return;
    }

    toast({
      title: `Export ${format.toUpperCase()} requested`,
      description: "Export job was triggered successfully.",
    });
  };

  return (
    <Card className="bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Export Reports</CardTitle>
        <CardDescription>UI triggers only. Backend export generation is not included in frontend scope.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {EXPORT_FORMATS.map((format) => (
          <Button key={format} variant="outline" onClick={() => void handleExport(format)}>
            <Download className="h-4 w-4" />
            {format.toUpperCase()}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
