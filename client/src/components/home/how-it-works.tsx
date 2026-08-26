export function HowItWorks() {
  const steps = [
    {
      icon: "app_registration",
      title: "Create a Profile",
      description: "Register as a worker or employer through our website or WhatsApp."
    },
    {
      icon: "location_on",
      title: "Find Local Matches",
      description: "Enter your location to find workers or jobs available near you."
    },
    {
      icon: "chat",
      title: "Connect via WhatsApp",
      description: "Communicate directly with workers or employers through WhatsApp."
    }
  ];

  const additionalSteps = [
    {
      icon: "work",
      title: "Complete the Job",
      description: "Work gets done with clear expectations and timely payments."
    },
    {
      icon: "star",
      title: "Rate the Experience",
      description: "Leave ratings and build your reputation for future opportunities."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How Kaam Mitra Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-neutral-100 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full mb-4">
                <span className="material-icons">{step.icon}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-neutral-700">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center mt-12 gap-8">
          {additionalSteps.map((step, index) => (
            <div key={index} className="bg-neutral-100 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full mb-4">
                <span className="material-icons">{step.icon}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-neutral-700">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
