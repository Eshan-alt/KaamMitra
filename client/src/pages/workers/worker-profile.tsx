import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

type WorkerProfileData = {
  user: {
    id: number;
    fullName: string;
    username: string;
    phone: string;
    location: string;
    email?: string;
  };
  profile: {
    primarySkill: string;
    description?: string;
    isAvailable: boolean;
    averageRating: number;
    totalRatings: number;
    verified: boolean;
  };
  ratings: Array<{
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
    employerId: number;
  }>;
};

// Schema for rating form
const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type RatingFormValues = z.infer<typeof ratingSchema>;

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);

  const numericId = parseInt(id);

  const { data, isLoading, isError } = useQuery<WorkerProfileData>({
    queryKey: [`/api/workers/${numericId}`],
    enabled: !isNaN(numericId),
  });

  // Rating form setup
  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async (values: RatingFormValues & { workerId: number; jobId: number }) => {
      const res = await apiRequest("POST", "/api/ratings", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workers/${numericId}`] });
      toast({
        title: "Rating Submitted",
        description: "Your rating has been successfully submitted.",
      });
      setIsRatingDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Rating Failed",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating);
  };

  const onSubmitRating = (values: RatingFormValues) => {
    // For a real app, we'd need to select which job to rate for
    // Here we're just using a placeholder job ID
    submitRatingMutation.mutate({
      ...values,
      workerId: numericId,
      jobId: 1, // This should be selected from a list of completed jobs
    });
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
            <h1 className="text-2xl font-bold mb-4">Worker Not Found</h1>
            <p className="mb-6">The worker profile you are looking for doesn't exist or has been removed.</p>
            <Button onClick={() => setLocation("/")}>Back to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle missing profile data
  const { user: workerUser, profile: rawProfile, ratings = [] } = data;
  // Create default profile if not available
  const profile = rawProfile || {
    primarySkill: "General Labor",
    description: "",
    isAvailable: true,
    averageRating: 0,
    totalRatings: 0,
    verified: false
  };
  const hasRated = user && ratings.some(rating => rating.employerId === user.id);
  const isOwnProfile = user && user.id === workerUser.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="outline" 
            className="mb-6"
            onClick={() => setLocation("/")}
          >
            <span className="material-icons mr-2">arrow_back</span>
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Worker Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">
                      {workerUser.fullName.charAt(0)}
                    </div>
                    <h1 className="text-2xl font-bold mb-1">{workerUser.fullName}</h1>
                    <p className="text-primary font-medium mb-2">{profile.primarySkill}</p>
                    
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-icons text-yellow-500">
                          {i < Math.floor(profile.averageRating) 
                            ? "star" 
                            : i === Math.floor(profile.averageRating) && profile.averageRating % 1 >= 0.5 
                              ? "star_half" 
                              : "star_border"}
                        </span>
                      ))}
                      <span className="ml-1 text-neutral-700">
                        {profile.averageRating.toFixed(1)} ({profile.totalRatings} {profile.totalRatings === 1 ? "rating" : "ratings"})
                      </span>
                    </div>

                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-center">
                        <Badge className={profile.isAvailable ? "bg-green-500" : "bg-red-500"}>
                          {profile.isAvailable ? "Available for Work" : "Not Available"}
                        </Badge>
                        {profile.verified && (
                          <Badge className="bg-blue-500 ml-2">Verified</Badge>
                        )}
                      </div>

                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <div className="flex items-center text-neutral-700 mb-2">
                          <span className="material-icons text-sm mr-2">location_on</span>
                          <span>{workerUser.location}</span>
                        </div>
                        {user && !isOwnProfile && (
                          <div className="flex items-center text-neutral-700">
                            <span className="material-icons text-sm mr-2">whatsapp</span>
                            <a 
                              href={`https://wa.me/${workerUser.phone.replace(/\D/g, '')}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Contact on WhatsApp
                            </a>
                          </div>
                        )}
                      </div>

                      {!isOwnProfile && user?.userType === "employer" && (
                        <Button 
                          className="w-full"
                          disabled={Boolean(hasRated)}
                          onClick={() => setIsRatingDialogOpen(true)}
                        >
                          {hasRated ? "Already Rated" : "Rate This Worker"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* About and Ratings */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700">
                    {profile.description || `Experienced ${profile.primarySkill} available for work in ${workerUser.location}.`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Ratings & Reviews</CardTitle>
                  <Badge variant="outline">{ratings.length} {ratings.length === 1 ? "review" : "reviews"}</Badge>
                </CardHeader>
                <CardContent>
                  {ratings.length > 0 ? (
                    <div className="space-y-4">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="border-b pb-4 last:border-0 last:pb-0">
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <p>No ratings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {workerUser.fullName}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRating)} className="space-y-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex justify-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <span 
                            key={rating}
                            onClick={() => handleRatingClick(rating)}
                            className="material-icons text-2xl cursor-pointer"
                            style={{ color: rating <= selectedRating ? "#EAB308" : "#D1D5DB" }}
                          >
                            star
                          </span>
                        ))}
                        <input type="hidden" {...field} value={selectedRating} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your experience working with this person..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submitRatingMutation.isPending}
                >
                  {submitRatingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : "Submit Rating"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
