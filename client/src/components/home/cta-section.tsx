import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="bg-primary text-white py-12">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Get Started with KaamMitra</h2>
        <p className="max-w-2xl mx-auto mb-6">No app download needed. Connect through WhatsApp and find work or workers in your area.</p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/register">
            <Button className="bg-[#25D366] hover:bg-[#1da851] text-white px-6 py-6 h-auto">
              <span className="material-icons mr-2">whatsapp</span>
              <span>Sign Up Now</span>
            </Button>
          </Link>
          
          <a href="#how-it-works">
            <Button variant="outline" className="bg-white text-primary hover:bg-white/90 px-6 py-6 h-auto">
              Learn More
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
