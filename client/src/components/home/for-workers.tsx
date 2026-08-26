import { Link } from "wouter";

export function ForWorkers() {
  const benefits = [
    {
      icon: "check_circle",
      title: "Find Jobs Near You",
      description: "Get notified about work opportunities in your locality without traveling far."
    },
    {
      icon: "check_circle",
      title: "No App Needed",
      description: "Use WhatsApp to receive job notifications and communicate with employers."
    },
    {
      icon: "check_circle",
      title: "Build Your Reputation",
      description: "Get rated for your work and build a trusted profile to attract more jobs."
    },
    {
      icon: "check_circle",
      title: "No Middlemen",
      description: "Connect directly with employers and keep 100% of your earnings."
    }
  ];

  return (
    <section id="for-workers" className="py-16 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600&h=400&auto=format&fit=crop" 
              alt="A tradesperson working" 
              className="rounded-lg shadow-md" 
              width="600" 
              height="400" 
            />
          </div>
          
          <div className="md:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">For Workers</h2>
            
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
            
            <Link href="/register?type=worker" className="inline-block mt-8 bg-primary text-white font-medium py-3 px-6 rounded flex items-center">
              Sign Up as a Worker
              <span className="material-icons ml-2">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
