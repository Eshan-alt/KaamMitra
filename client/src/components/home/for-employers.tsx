import { Link } from "wouter";

export function ForEmployers() {
  const benefits = [
    {
      icon: "check_circle",
      title: "Find Verified Workers",
      description: "Access a pool of trusted, rated workers in your locality for any job."
    },
    {
      icon: "check_circle",
      title: "Post Jobs Easily",
      description: "Create job posts in minutes and reach multiple workers at once."
    },
    {
      icon: "check_circle",
      title: "Direct Communication",
      description: "Connect with workers through WhatsApp for seamless communication."
    },
    {
      icon: "check_circle",
      title: "Verified Skills",
      description: "Browse worker profiles with ratings and verified skill sets."
    }
  ];

  return (
    <section id="for-employers" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600&h=400&auto=format&fit=crop" 
              alt="House renovation project" 
              className="rounded-lg shadow-md" 
              width="600" 
              height="400" 
            />
          </div>
          
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">For Employers</h2>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <span className="material-icons text-green-500 mr-3">{benefit.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{benefit.title}</h3>
                    <p className="text-neutral-700">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/register?type=employer" className="inline-block mt-8 bg-[#0066cc] text-white font-medium py-3 px-6 rounded hover:bg-[#0052a3] transition-colors duration-300 flex items-center">
              Sign Up as an Employer
              <span className="material-icons ml-2">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
