import { useMutation, useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, BriefcaseBusiness, Flag, FileCheck2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Overview = { users: number; jobs: number; openReports: number };
type Report = {
  id: number;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
};
type Verification = {
  id: number;
  userId: number;
  documentType: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  verificationNotes: string | null;
};

export default function AdminPage() {
  const { toast } = useToast();
  const overview = useQuery<Overview>({ queryKey: ["/api/admin/overview"] });
  const reports = useQuery<Report[]>({ queryKey: ["/api/admin/reports"] });
  const verifications = useQuery<Verification[]>({ queryKey: ["/api/admin/verifications"] });
  const moderate = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "reviewing" | "resolved" | "dismissed" }) => {
      const response = await apiRequest("PATCH", `/api/admin/reports/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
      toast({ title: "Report updated" });
    },
    onError: (error: Error) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });
  const reviewVerification = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "verified" | "rejected" }) => {
      const response = await apiRequest("PATCH", `/api/admin/verifications/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      toast({ title: "Verification updated" });
    },
    onError: (error: Error) => toast({ title: "Verification update failed", description: error.message, variant: "destructive" }),
  });

  const stats = [
    { label: "Users", value: overview.data?.users, icon: Users },
    { label: "Jobs", value: overview.data?.jobs, icon: BriefcaseBusiness },
    { label: "Open reports", value: overview.data?.openReports, icon: Flag },
  ];

  return (
    <main className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-muted-foreground">Review marketplace activity and moderation reports.</p>
        </div>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-3" aria-label="Marketplace overview">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {overview.isLoading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{value ?? 0}</p>}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mb-10" aria-labelledby="verifications-heading">
        <h2 id="verifications-heading" className="mb-4 flex items-center gap-2 text-2xl font-semibold">
          <FileCheck2 className="h-5 w-5" aria-hidden="true" /> Identity verifications
        </h2>
        {verifications.isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : verifications.isError ? (
          <p className="rounded-md border border-destructive/30 p-4 text-destructive">Verifications could not be loaded.</p>
        ) : verifications.data?.length ? (
          <div className="space-y-3">
            {verifications.data.map((verification) => (
              <Card key={verification.id}>
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong>User #{verification.userId}</strong>
                      <Badge variant="outline">{verification.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{verification.documentType.replaceAll("_", " ")}</p>
                    <a className="text-sm text-primary underline" href={`/api/verification/documents/${verification.id}`} target="_blank" rel="noreferrer">
                      Review private document
                    </a>
                  </div>
                  {verification.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewVerification.mutate({ id: verification.id, status: "verified" })}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => reviewVerification.mutate({ id: verification.id, status: "rejected" })}>Reject</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-md border p-8 text-center text-muted-foreground">No identity verifications submitted.</p>
        )}
      </section>

      <section aria-labelledby="reports-heading">
        <h2 id="reports-heading" className="mb-4 text-2xl font-semibold">Moderation reports</h2>
        {reports.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
        ) : reports.isError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            Reports could not be loaded.
          </p>
        ) : reports.data?.length ? (
          <div className="space-y-3">
            {reports.data.map((report) => (
              <Card key={report.id}>
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <strong>{report.reason}</strong>
                      <Badge variant="outline">{report.status}</Badge>
                    </div>
                    {report.details && <p className="text-sm text-muted-foreground">{report.details}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: report.id, status: "reviewing" })}>Review</Button>
                    <Button size="sm" onClick={() => moderate.mutate({ id: report.id, status: "resolved" })}>Resolve</Button>
                    <Button size="sm" variant="ghost" onClick={() => moderate.mutate({ id: report.id, status: "dismissed" })}>Dismiss</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-md border p-8 text-center text-muted-foreground">No reports need attention.</p>
        )}
      </section>
    </main>
  );
}