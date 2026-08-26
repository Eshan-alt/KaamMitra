import { useState } from "react";
import { BriefcaseBusiness, MapPin, Navigation, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NearbyJob = { id: number; title: string; location: string; wage: string };

export function NearbyMap({ jobs = [] }: { jobs?: NearbyJob[] }) {
  const [radius, setRadius] = useState("10");
  const visibleJobs = jobs.slice(0, 3);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div><CardTitle className="flex items-center gap-2 text-lg"><Navigation className="h-5 w-5 text-primary" /> Nearby opportunities</CardTitle><p className="mt-1 text-sm text-muted-foreground">Explore work around your location</p></div>
        <Select value={radius} onValueChange={setRadius}>
          <SelectTrigger className="w-[105px]" aria-label="Search radius"><SlidersHorizontal className="mr-1 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="5">Within 5 km</SelectItem><SelectItem value="10">Within 10 km</SelectItem><SelectItem value="20">Within 20 km</SelectItem></SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[250px] overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_45%,hsl(var(--primary)/.15),transparent_42%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 bg-primary/10" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-3 text-primary-foreground shadow-lg"><Navigation className="h-5 w-5" /></div>
          {["left-[24%] top-[28%]", "right-[18%] top-[32%]", "left-[28%] bottom-[20%]", "right-[30%] bottom-[22%]"].map((position, index) => <span key={position} className={`absolute ${position} rounded-full bg-fuchsia-500 p-1.5 text-white shadow-md`}><MapPin className="h-3.5 w-3.5" /><span className="sr-only">Nearby result {index + 1}</span></span>)}
          <Badge className="absolute bottom-3 left-3 bg-background/90 text-foreground shadow-sm">Showing {radius} km radius</Badge>
        </div>
        <div className="space-y-3">
          {visibleJobs.length ? visibleJobs.map((job) => <div key={job.id} className="flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"><div className="rounded-lg bg-primary/10 p-2 text-primary"><BriefcaseBusiness className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{job.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</p></div><span className="whitespace-nowrap text-xs font-semibold text-emerald-600">{job.wage}</span></div>) : <div className="rounded-xl border border-dashed p-6 text-center"><MapPin className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">No jobs in this area yet</p><p className="mt-1 text-xs text-muted-foreground">Try expanding your search radius.</p></div>}
          <Button variant="outline" className="w-full" onClick={() => window.location.assign("/#available-jobs")}>Browse all nearby jobs</Button>
        </div>
      </CardContent>
    </Card>
  );
}