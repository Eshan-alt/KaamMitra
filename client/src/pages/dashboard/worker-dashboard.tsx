import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type WorkerDashboardData = {
  profile: {
    primarySkill: string;
    averageRating: number;
    totalRatings: number;
    isAvailable: boolean;
  };
  applications: Array<{
    id: number;
    status: string;
    appliedAt: string;
    job: {
      id: number;
      title: string;
      location: string;
      wage: string;
      createdAt: string;
    };
  }>;
  ratings: Array<{
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
};

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data, isLoading } = useQuery<WorkerDashboardData>({
    queryKey: ["/api/workers/dashboard"],
    enabled: !!user,
  });

  const availabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const response = await apiRequest("PATCH", "/api/workers/profile/availability", { isAvailable });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers/dashboard"] });
      toast({
        title: "Availability updated",
        description: "Your work availability has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not update availability",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
  
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Worker Dashboard</h1>
              <p className="text-neutral-500">Welcome back, {user?.fullName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">My Skill</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{data?.profile.primarySkill || "Not specified"}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">My Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-primary mr-2">
                    {data?.profile.averageRating || 0}
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-icons text-yellow-500">
                        {i < Math.floor(data?.profile.averageRating || 0) 
                          ? "star" 
                          : i === Math.floor(data?.profile.averageRating || 0) && (data?.profile.averageRating || 0) % 1 >= 0.5 
                            ? "star_half" 
                            : "star_border"}
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-neutral-500">
                    ({data?.profile.totalRatings || 0} {data?.profile.totalRatings === 1 ? "rating" : "ratings"})
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Availability Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={data?.profile.isAvailable ? "bg-green-500" : "bg-red-500"}>
                    {data?.profile.isAvailable ? "Available for Work" : "Not Available"}
                  </Badge>
                   <Button
                     type="button"
                     size="sm"
                     variant="outline"
                     disabled={availabilityMutation.isPending}
                     onClick={() => availabilityMutation.mutate(!data?.profile.isAvailable)}
                   >
                     {availabilityMutation.isPending ? "Updating..." : "Toggle Status"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="applications">My Applications</TabsTrigger>
              <TabsTrigger value="ratings">My Ratings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {data?.applications && data.applications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Job Title</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Location</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Wage</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Applied On</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-neutral-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {data.applications.map((application) => (
                          <tr key={application.id}>
                            <td className="px-4 py-3">{application.job.title}</td>
                            <td className="px-4 py-3">{application.job.location}</td>
                            <td className="px-4 py-3">{application.job.wage}</td>
                            <td className="px-4 py-3">{new Date(application.appliedAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(application.status)}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/jobs/${application.job.id}`}>
                                <Button size="sm" variant="outline">View Job</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500 mb-4">You haven't applied to any jobs yet.</p>
                    <Link href="/">
                      <Button>Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ratings">
              {data?.ratings && data.ratings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.ratings.map((rating) => (
                    <Card key={rating.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="material-icons text-yellow-500">
                              {i < rating.rating ? "star" : "star_border"}
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-neutral-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-700">{rating.comment || "No comment provided."}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-neutral-500">You don't have any ratings yet. Complete jobs to receive ratings from employers.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
