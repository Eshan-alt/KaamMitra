import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart3, CheckCircle2, Clock3, Loader2, MessageCircle, Plus, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";

type EmployerDashboardData = {
  jobs: Array<{
    id: number;
    title: string;
    description: string;
    location: string;
    category: string;
    wage: string;
    duration: string;
    isActive: boolean;
    createdAt: string;
    applications: Array<{
      id: number;
      status: string;
      appliedAt: string;
      worker: {
        id: number;
        fullName: string;
        phone: string;
      };
    }>;
  }>;
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isJobToggleDialogOpen, setIsJobToggleDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<EmployerDashboardData>({
    queryKey: ["/api/employers/dashboard"],
    enabled: !!user,
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${applicationId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employers/dashboard"] });
      setIsStatusDialogOpen(false);
    },
  });

  const toggleJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employers/dashboard"] });
      setIsJobToggleDialogOpen(false);
    },
  });

  const handleUpdateApplicationStatus = (status: string) => {
    if (selectedApplicationId) {
      updateApplicationStatusMutation.mutate({
        applicationId: selectedApplicationId,
        status,
      });
    }
  };

  const handleToggleJobStatus = () => {
    if (selectedJobId) {
      const job = data?.jobs.find(j => j.id === selectedJobId);
      if (job) {
        toggleJobStatusMutation.mutate({
          jobId: selectedJobId,
          isActive: !job.isActive,
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const activeJobs = data?.jobs.filter(job => job.isActive) || [];
  const inactiveJobs = data?.jobs.filter(job => !job.isActive) || [];
  const totalApplications = data?.jobs.reduce((acc, job) => acc + job.applications.length, 0) || 0;
  const pendingApplications = data?.jobs.reduce(
    (acc, job) => acc + job.applications.filter(app => app.status === "pending").length,
    0
  ) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Employer Dashboard</h1>
              <p className="text-neutral-500">Welcome back, {user?.fullName}</p>
            </div>
            <Link href="/post-job">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post a New Job
              </Button>
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-primary/20 bg-primary/5"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active jobs</CardTitle><BarChart3 className="h-4 w-4 text-primary" /></CardHeader><CardContent><p className="text-3xl font-bold text-primary">{activeJobs.length}</p><p className="mt-1 text-xs text-muted-foreground">Currently visible to workers</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending applications</CardTitle><Clock3 className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><p className="text-3xl font-bold">{pendingApplications}</p><p className="mt-1 text-xs text-muted-foreground">Ready for your review</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Candidates</CardTitle><Users className="h-4 w-4 text-sky-500" /></CardHeader><CardContent><p className="text-3xl font-bold">{totalApplications}</p><p className="mt-1 text-xs text-muted-foreground">Applications across your jobs</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle><MessageCircle className="h-4 w-4 text-fuchsia-500" /></CardHeader><CardContent><Link href="/messaging" className="text-sm font-semibold text-primary hover:underline">Open your inbox →</Link><p className="mt-1 text-xs text-muted-foreground">Keep candidates informed</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Hiring rating</CardTitle><CheckCircle2 className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><p className="text-3xl font-bold">4.8</p><p className="mt-1 text-xs text-muted-foreground">Based on completed jobs</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Employer trust</CardTitle><ShieldCheck className="h-4 w-4 text-primary" /></CardHeader><CardContent><Badge className={user?.verificationStatus === "verified" ? "bg-emerald-500" : ""}>{user?.verificationStatus === "verified" ? "Verified employer" : "Verification pending"}</Badge><p className="mt-2 text-xs text-muted-foreground">91% response rate</p></CardContent></Card>
          </div>
          <div className="mb-8"><AnalyticsPanel employer /></div>

          <Tabs defaultValue="active-jobs" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="active-jobs">Active Jobs</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="inactive-jobs">Inactive Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="active-jobs">
              {activeJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeJobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <Badge className="bg-green-500">{job.applications.length} applications</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">location_on</span>
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">attach_money</span>
                            <span>{job.wage}</span>
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">category</span>
                            <span>{job.category}</span>
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">schedule</span>
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-700 mb-4 line-clamp-2">{job.description}</p>
                        <div className="flex gap-2">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                          </Link>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setIsJobToggleDialogOpen(true);
                            }}
                          >
                            Deactivate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-neutral-500 mb-4">You don't have any active job postings.</p>
                  <Link href="/post-job">
                    <Button>Post a New Job</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="applications">
              {totalApplications > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Job Title</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Worker</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Applied On</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {data?.jobs.flatMap(job => 
                          job.applications.map(application => (
                            <tr key={application.id}>
                              <td className="px-4 py-3">{job.title}</td>
                              <td className="px-4 py-3">{application.worker.fullName}</td>
                              <td className="px-4 py-3">{new Date(application.appliedAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusColor(application.status)}>
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Link href={`/workers/${application.worker.id}`}>
                                    <Button size="sm" variant="outline">View Worker</Button>
                                  </Link>
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => {
                                      setSelectedApplicationId(application.id);
                                      setIsStatusDialogOpen(true);
                                    }}
                                  >
                                    Update Status
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-neutral-500 mb-4">You haven't received any applications yet.</p>
                  <Link href="/post-job">
                    <Button>Post a New Job</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inactive-jobs">
              {inactiveJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inactiveJobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <CardHeader className="bg-neutral-100 pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <Badge variant="outline">{job.applications.length} applications</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">location_on</span>
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">attach_money</span>
                            <span>{job.wage}</span>
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="material-icons text-sm mr-1">schedule</span>
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-700 mb-4 line-clamp-2">{job.description}</p>
                        <div className="flex gap-2">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                          </Link>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setIsJobToggleDialogOpen(true);
                            }}
                          >
                            Reactivate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-neutral-500">You don't have any inactive job postings.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Application Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of this application to manage your hiring process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-yellow-500 hover:bg-yellow-600" 
              disabled={updateApplicationStatusMutation.isPending}
              onClick={() => handleUpdateApplicationStatus("pending")}
            >
              Mark as Pending
            </Button>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={updateApplicationStatusMutation.isPending}
              onClick={() => handleUpdateApplicationStatus("accepted")}
            >
              Accept Application
            </Button>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={updateApplicationStatusMutation.isPending}
              onClick={() => handleUpdateApplicationStatus("rejected")}
            >
              Reject Application
            </Button>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={updateApplicationStatusMutation.isPending}
              onClick={() => handleUpdateApplicationStatus("completed")}
            >
              Mark Job as Completed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Status Toggle Dialog */}
      <Dialog open={isJobToggleDialogOpen} onOpenChange={setIsJobToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedJobId && data?.jobs.find(j => j.id === selectedJobId)?.isActive 
                ? "Deactivate Job" 
                : "Reactivate Job"}
            </DialogTitle>
            <DialogDescription>
              {selectedJobId && data?.jobs.find(j => j.id === selectedJobId)?.isActive 
                ? "This job will no longer be visible to workers and won't receive new applications." 
                : "This job will be visible to workers and can receive new applications."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsJobToggleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant={selectedJobId && data?.jobs.find(j => j.id === selectedJobId)?.isActive ? "destructive" : "default"}
              disabled={toggleJobStatusMutation.isPending}
              onClick={handleToggleJobStatus}
            >
              {toggleJobStatusMutation.isPending ? "Processing..." : 
                selectedJobId && data?.jobs.find(j => j.id === selectedJobId)?.isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
