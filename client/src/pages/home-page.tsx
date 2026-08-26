import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { ForWorkers } from "@/components/home/for-workers";
import { ForEmployers } from "@/components/home/for-employers";
import { FeaturedJobs } from "@/components/home/featured-jobs";
import { FeaturedWorkers } from "@/components/home/featured-workers";
import { Testimonials } from "@/components/home/testimonials";
import { CTASection } from "@/components/home/cta-section";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      if (user.userType === "worker") {
        setLocation("/worker-dashboard");
      } else if (user.userType === "employer") {
        setLocation("/employer-dashboard");
      } else if (user.userType === "admin") {
        setLocation("/admin-dashboard");
      }
    }
  }, [user, setLocation]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <HowItWorks />
        <ForWorkers />
        <ForEmployers />
        <FeaturedJobs />
        <FeaturedWorkers />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
