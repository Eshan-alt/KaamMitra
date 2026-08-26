import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@shared/schema";
import { useState } from "react";

export function FeaturedJobs() {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");
  const [showAllJobs, setShowAllJobs] = useState(false);

  // Fetch jobs data
  const { data: jobs, isLoading } = useQuery<(Job & { employer: { fullName: string } })[]>({
    queryKey: ["/api/jobs"],
  });

  // Filter jobs based on selected category and location
  const filteredJobs = jobs?.filter(job => {
    const matchesCategory = category === "all" || job.category === category;
    const matchesLocation = !location || job.location.toLowerCase().includes(location.toLowerCase());
    return matchesCategory && matchesLocation;
  }) || [];
  const visibleJobs = showAllJobs ? filteredJobs : filteredJobs.slice(0, 3);

  const handleFindJobs = () => {
    document.getElementById("available-jobs-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const categories = [
    { value: "all", label: "All Jobs" },
    { value: "construction", label: "Construction" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "housekeeping", label: "Housekeeping" },
    { value: "gardening", label: "Gardening" },
  ];

  return (
    <section id="available-jobs" className="py-16 bg-neutral-100">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Available Jobs Near You</h2>
        
        {/* Location Filter */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
            <span className="material-icons text-neutral-500 mr-2">location_on</span>
            <input
              type="text"
              placeholder="Enter your location"
              className="flex-grow bg-transparent focus:outline-none text-neutral-700"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button 
              type="button"
              className="bg-primary text-white"
              onClick={handleFindJobs}
            >
              Find Jobs
            </Button>
          </div>
        </div>
        
        {/* Job Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`px-4 py-2 rounded-full ${
                category === cat.value
                  ? "bg-primary text-white" 
                  : "bg-white text-neutral-700"
              }`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        {/* Job Cards */}
        <div id="available-jobs-results" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeleton loading state
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                  <div className="flex items-center mb-2">
                    <Skeleton className="h-4 w-1/2 mr-2" />
                  </div>
                  <div className="flex items-center mb-3">
                    <Skeleton className="h-4 w-1/3 mr-2" />
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredJobs.length > 0 ? (
              visibleJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <span className="bg-green-100 text-green-600 text-sm px-2 py-1 rounded">{job.wage}</span>
                  </div>
                  <div className="flex items-center text-neutral-500 text-sm mb-2">
                    <span className="material-icons text-sm mr-1">location_on</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-neutral-500 text-sm mb-3">
                    <span className="material-icons text-sm mr-1">schedule</span>
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-neutral-700 mb-4">{job.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                        {job.employer.fullName.charAt(0)}
                      </div>
                      <span className="text-sm text-neutral-700">{job.employer.fullName}</span>
                    </div>
                    <Link href={`/jobs/${job.id}`} className="flex items-center text-primary hover:underline">
                        <span className="material-icons text-sm mr-1">visibility</span>
                        <span className="text-sm">View Details</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-neutral-500">No jobs found matching your criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
        
        {filteredJobs.length > 3 && (
          <div className="mt-8 text-center">
            <Button
              type="button"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => setShowAllJobs((current) => !current)}
              aria-expanded={showAllJobs}
            >
              {showAllJobs ? "Show Fewer Jobs" : "View More Jobs"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
