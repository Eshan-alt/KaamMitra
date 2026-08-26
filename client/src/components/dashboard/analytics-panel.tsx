import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const weekly = [
  { label: "Mon", jobs: 4, applications: 7 },
  { label: "Tue", jobs: 6, applications: 10 },
  { label: "Wed", jobs: 3, applications: 8 },
  { label: "Thu", jobs: 8, applications: 13 },
  { label: "Fri", jobs: 5, applications: 11 },
  { label: "Sat", jobs: 7, applications: 9 },
  { label: "Sun", jobs: 4, applications: 6 },
];

export function AnalyticsPanel({ employer = false }: { employer?: boolean }) {
  const max = Math.max(...weekly.map((item) => (employer ? item.applications : item.jobs)));
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b bg-muted/20">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" /> Weekly analytics</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{employer ? "Applications received this week" : "Jobs matched to your profile"}</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600"><TrendingUp className="h-4 w-4" /> 18%</div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex h-44 items-end gap-2 sm:gap-4">
          {weekly.map((item) => {
            const value = employer ? item.applications : item.jobs;
            return (
              <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{value}</span>
                <div className="flex w-full flex-1 items-end rounded-t-md bg-muted/50">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-fuchsia-400 transition-all" style={{ height: `${Math.max(15, (value / max) * 100)}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
          <div><p className="text-lg font-bold">{employer ? "62%" : "24"}</p><p className="text-xs text-muted-foreground">{employer ? "Hiring success" : "Profile views"}</p></div>
          <div><p className="text-lg font-bold">{employer ? "2.4h" : "4.8/5"}</p><p className="text-xs text-muted-foreground">{employer ? "Response time" : "Trust score"}</p></div>
          <div><p className="text-lg font-bold">{employer ? "91%" : "86%"}</p><p className="text-xs text-muted-foreground">{employer ? "Reply rate" : "Profile complete"}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}