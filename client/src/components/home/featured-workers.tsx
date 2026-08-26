import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerProfile, User } from "@shared/schema";
import { useState } from "react";

type WorkerWithUser = WorkerProfile & { user: User };

export function FeaturedWorkers() {
  const [category, setCategory] = useState("all");
  const [showAllWorkers, setShowAllWorkers] = useState(false);

  // Fetch top rated workers
  const { data: workers, isLoading } = useQuery<WorkerWithUser[]>({
    queryKey: ["/api/workers", { topRated: true }],
  });

  // Filter workers based on selected category
  const filteredWorkers = workers?.filter((worker) => {
    return category === "all" || worker.primarySkill.toLowerCase() === category;
  }) || [];
  const visibleWorkers = showAllWorkers ? filteredWorkers : filteredWorkers.slice(0, 4);

  const categories = [
    { value: "all", label: "All Workers" },
    { value: "construction", label: "Construction" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "housekeeping", label: "Housekeeping" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Top Rated Workers</h2>
        
        {/* Worker Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`px-4 py-2 rounded-full ${
                category === cat.value
                  ? "bg-primary text-white" 
                  : "bg-white text-neutral-700 border border-neutral-300"
              }`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        {/* Worker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Skeleton loading state
            Array(4).fill(0).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-neutral-100 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col items-center">
                  <Skeleton className="w-20 h-20 rounded-full mb-3" />
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))
          ) : filteredWorkers.length > 0 ? (
              visibleWorkers.map((worker) => (
              <div key={worker.user.id} className="bg-neutral-100 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-3">
                    {worker.user.fullName.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-lg">{worker.user.fullName}</h3>
                  <p className="text-primary font-medium">{worker.primarySkill}</p>
                  <div className="flex items-center my-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={`star-${worker.id}-${i}`} className="material-icons text-yellow-500">
                        {i < Math.floor(worker.averageRating) 
                          ? "star" 
                          : i === Math.floor(worker.averageRating) && worker.averageRating % 1 >= 0.5 
                            ? "star_half" 
                            : "star_border"}
                      </span>
                    ))}
                    <span className="ml-1 text-neutral-700">{worker.averageRating}</span>
                  </div>
                  <div className="flex items-center text-neutral-500 text-sm mb-3">
                    <span className="material-icons text-sm mr-1">location_on</span>
                    <span>{worker.user.location}</span>
                  </div>
                  <p className="text-neutral-700 text-sm text-center mb-4">
                    {worker.description || `Experienced ${worker.primarySkill} available for work in your area.`}
                  </p>
                  <Link href={`/workers/${worker.user.id}`} className="w-full py-2 bg-primary text-white rounded text-center flex items-center justify-center">
                    <span className="material-icons text-sm mr-1">visibility</span>
                    <span>View Profile</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-neutral-500">No workers found in this category.</p>
            </div>
          )}
        </div>
        
        {filteredWorkers.length > 4 && (
          <div className="mt-8 text-center">
            <Button
              type="button"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => setShowAllWorkers((current) => !current)}
              aria-expanded={showAllWorkers}
            >
              {showAllWorkers ? "Show Fewer Workers" : "View More Workers"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
