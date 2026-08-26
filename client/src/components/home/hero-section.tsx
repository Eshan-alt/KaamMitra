import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary to-purple-700 text-white py-12 md:py-24 overflow-hidden">
      {/* Background decorative elements with improved animations */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-white animate-float"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white animate-bounce-slow"></div>
        
        {/* Additional decorative elements */}
        <div className="absolute top-1/4 right-1/3 w-32 h-32 rounded-full bg-white/60 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 left-1/5 w-24 h-24 rounded-full bg-pink-400/30 blur-2xl animate-float-delay"></div>
      </div>
      
      {/* Decorative mesh grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="mb-4 inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium shadow-lg animate-pulse">
              <span className="mr-2">✨</span> Kaam Mitra - Connecting Talent with Opportunity
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white via-blue-100 to-pink-200 bg-clip-text text-transparent drop-shadow-lg leading-tight">
              Find Local Work.<br /> 
              <span className="text-3xl md:text-5xl">Hire Local Talent.</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-lg leading-relaxed animate-fadeIn">
              Connecting skilled workers with employers in your neighborhood. No middlemen, just professional service and honest work.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href="/register?type=worker" className="bg-white text-primary font-semibold py-4 px-8 rounded-xl hover:bg-blue-50 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-purple-300/50 hover:-translate-y-1 text-lg">
                <span className="material-icons mr-2">engineering</span>
                I'm a Worker
              </Link>
              <Link href="/register?type=employer" className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-purple-500/50 hover:-translate-y-1 border border-white/20 text-lg">
                <span className="material-icons mr-2">business_center</span>
                I'm an Employer
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center space-x-4 text-white/80">
              <div className="flex items-center">
                <span className="material-icons text-yellow-400 mr-1">verified</span>
                <span className="text-sm">Verified Workers</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-400 mr-1">security</span>
                <span className="text-sm">Secure Payments</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-blue-400 mr-1">support_agent</span>
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="relative transform transition-transform hover:scale-[1.02] duration-500">
              {/* Enhanced image styling */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500/40 to-pink-500/20 rounded-2xl blur-md"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/40 to-pink-500/20 rounded-xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop" 
                alt="Professional workers with digital tools" 
                className="rounded-xl shadow-2xl border-2 border-white/30 object-cover w-full h-auto relative z-10" 
                width="600" 
                height="400" 
                onError={(e) => {
                  // Fallback to another image if the first one fails
                  e.currentTarget.src = "https://images.unsplash.com/photo-1590142035743-4d7e0b7b0b4a?q=80&w=800&auto=format&fit=crop";
                }}
                loading="eager"
              />
              
              {/* Enhanced stats badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-5 rounded-lg shadow-lg transform transition-transform hover:scale-105 z-20">
                <p className="font-bold flex items-center">
                  <span className="material-icons mr-1">star</span>
                  Trusted by thousands!
                </p>
              </div>
              
              {/* Additional floating badge */}
              <div className="absolute -top-4 -left-4 bg-white text-primary py-2 px-4 rounded-lg shadow-lg z-20 transform rotate-rotate-6 animate-bounce-slow">
                <p className="font-bold text-sm flex items-center">
                  <span className="material-icons text-yellow-500 mr-1 text-sm">thumb_up</span>
                  4.9/5 Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating stats card */}
      <div className="bg-white/95 backdrop-blur-sm text-neutral-900 rounded-xl shadow-2xl p-6 max-w-sm mx-auto md:mx-0 md:absolute md:bottom-0 md:right-24 md:translate-y-1/2 border-b-4 border-primary hover:shadow-purple-300/30 transition-shadow duration-300">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">5000+</p>
            <p className="text-neutral-700 font-medium">Workers</p>
          </div>
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">3200+</p>
            <p className="text-neutral-700 font-medium">Jobs Completed</p>
          </div>
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">1800+</p>
            <p className="text-neutral-700 font-medium">Employers</p>
          </div>
          <div className="text-center group">
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">4.8/5</p>
            <p className="text-neutral-700 font-medium">User Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
