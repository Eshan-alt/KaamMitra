import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type JobDetailsData = {
  job: {
    id: number;
    title: string;
    description: string;
    location: string;
    category: string;
    wage: string;
    duration: string;
    isActive: boolean;
    createdAt: string;
    employer: {
      id: number;
      fullName: string;
      phone: string;
    };
  };
  applications: Array<{
    id: number;
    status: string;
    appliedAt: string;
    worker: {
      id: number;
      fullName: string;
    };
  }>;
};

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const numericId = parseInt(id);

  const { data, isLoading, isError } = useQuery<JobDetailsData>({
    queryKey: [`/api/jobs/${numericId}`],
    enabled: !isNaN(numericId),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/jobs/${numericId}/apply`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${numericId}`] });
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted.",
      });
      setIsConfirmDialogOpen(false);
      setIsApplying(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      setIsConfirmDialogOpen(false);
      setIsApplying(false);
    },
  });

  const handleApply = async () => {
    setIsApplying(true);
    applyMutation.mutate();
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

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <p className="mb-6">The job you are looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/")}>Back to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { job, applications } = data;
  const hasUserApplied = user?.userType === "worker" && 
    applications.some(app => app.worker.id === user.id);
  const isEmployer = user?.id === job.employer.id;
  const isActiveJob = job.isActive;

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              className="mb-6"
              onClick={() => setLocation("/")}
            >
              <span className="material-icons mr-2">arrow_back</span>
              Back to Jobs
            </Button>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
                    <p className="text-neutral-500">{job.category}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!isActiveJob && (
                      <Badge variant="destructive" className="self-start">Inactive Job</Badge>
                    )}
                    <Badge className="bg-green-500 text-white self-start">{job.wage}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mt-6">
                  <div className="flex items-center text-neutral-700">
                    <span className="material-icons mr-2">location_on</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-neutral-700">
                    <span className="material-icons mr-2">schedule</span>
                    <span>Posted on {getFormattedDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center text-neutral-700">
                    <span className="material-icons mr-2">business</span>
                    <span>Posted by {job.employer.fullName}</span>
                  </div>
                  {job.duration && (
                    <div className="flex items-center text-neutral-700">
                      <span className="material-icons mr-2">date_range</span>
                      <span>Duration: {job.duration}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                <p className="whitespace-pre-line text-neutral-700 mb-8">
                  {job.description}
                </p>

                {user ? (
                  user.userType === "worker" ? (
                    <div className="flex justify-center">
                      {hasUserApplied ? (
                        <div className="text-center">
                          <Badge className="bg-blue-500 mb-2">Already Applied</Badge>
                          <p className="text-neutral-500">
                            You have already applied to this job. 
                            The employer will contact you if interested.
                          </p>
                        </div>
                      ) : (
                        <Button
                          disabled={!isActiveJob || isApplying}
                          size="lg"
                          onClick={() => setIsConfirmDialogOpen(true)}
                        >
                          {!isActiveJob ? "Job No Longer Active" : "Apply for this Job"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    isEmployer && (
                      <div className="bg-primary/5 rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Applications ({applications.length})</h3>
                        {applications.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="px-4 py-2 text-left">Worker</th>
                                  <th className="px-4 py-2 text-left">Applied On</th>
                                  <th className="px-4 py-2 text-left">Status</th>
                                  <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {applications.map((app) => (
                                  <tr key={app.id} className="border-b last:border-0">
                                    <td className="px-4 py-2">{app.worker.fullName}</td>
                                    <td className="px-4 py-2">{getFormattedDate(app.appliedAt)}</td>
                                    <td className="px-4 py-2">
                                      <Badge className={
                                        app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                        app.status === "accepted" ? "bg-green-100 text-green-800" :
                                        app.status === "rejected" ? "bg-red-100 text-red-800" :
                                        "bg-blue-100 text-blue-800"
                                      }>
                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setLocation(`/employer-dashboard`)}
                                      >
                                        Manage
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-neutral-500">No applications received yet.</p>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center">
                    <p className="mb-4 text-neutral-700">
                      You need to be logged in as a worker to apply for this job.
                    </p>
                    <Button onClick={() => setLocation("/login")}>
                      Login to Apply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isEmployer && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center">
                      <span className="material-icons mr-2">person</span>
                      <span className="font-medium">{job.employer.fullName}</span>
                    </div>
                    {user ? (
                      <div className="flex items-center">
                        <span className="material-icons mr-2">whatsapp</span>
                        <a 
                          href={`https://wa.me/${job.employer.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Contact via WhatsApp
                        </a>
                      </div>
                    ) : (
                      <p className="text-neutral-700">
                        <span className="material-icons mr-2 align-text-bottom">lock</span>
                        Login to see contact details
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />

      {/* Apply Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply for this job? The employer will be able to see your profile and contact you via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              disabled={applyMutation.isPending}
              onClick={handleApply}
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : "Confirm Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
