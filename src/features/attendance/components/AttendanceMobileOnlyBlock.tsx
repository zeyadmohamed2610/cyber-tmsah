import { Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AttendanceMobileOnlyBlock = () => {
  const blockTitle = "\u0627\u0644\u0646\u0638\u0627\u0645 \u0645\u062a\u0627\u062d \u0639\u0628\u0631 \u0627\u0644\u0647\u0627\u062a\u0641 \u0641\u0642\u0637";
  const blockDescription =
    "\u064a\u0631\u062c\u0649 \u0641\u062a\u062d \u0646\u0638\u0627\u0645 \u0627\u0644\u062d\u0636\u0648\u0631 \u0645\u0646 \u062c\u0647\u0627\u0632 \u0647\u0627\u062a\u0641 \u0644\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8" dir="rtl">
      <Card className="w-full max-w-md border-primary/30 bg-card/95 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Smartphone className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">{blockTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">{blockDescription}</CardContent>
      </Card>
    </main>
  );
};
