import { Link } from "wouter";
import { BrandLogo } from "@/components/layout/brand-logo";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <BrandLogo inverse />
            </div>
            <p className="text-neutral-300 mb-4">Connecting daily wage workers with local job opportunities.</p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Kaam Mitra on Facebook"
                className="text-white hover:text-primary transition"
              >
                <span className="material-icons">facebook</span>
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Kaam Mitra on LinkedIn"
                className="text-white hover:text-primary transition"
              >
                <span className="material-icons">insert_link</span>
              </a>
              <a
                href="https://wa.me/?text=Join%20me%20on%20Kaam%20Mitra"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share Kaam Mitra on WhatsApp"
                className="text-white hover:text-primary transition"
              >
                <span className="material-icons">whatsapp</span>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><a href="/#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="/#for-workers" className="hover:text-white transition">For Workers</a></li>
              <li><a href="/#for-employers" className="hover:text-white transition">For Employers</a></li>
              <li><a href="/#how-it-works" className="hover:text-white transition">About Kaam Mitra</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-neutral-300">
              <li><a href="/#available-jobs" className="hover:text-white transition">Construction</a></li>
              <li><a href="/#available-jobs" className="hover:text-white transition">Plumbing</a></li>
              <li><a href="/#available-jobs" className="hover:text-white transition">Electrical</a></li>
              <li><a href="/#available-jobs" className="hover:text-white transition">Housekeeping</a></li>
              <li><a href="/#available-jobs" className="hover:text-white transition">Carpentry</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">email</span>
                <a href="mailto:support@kaammitra.com" className="hover:text-white transition">support@kaammitra.com</a>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">help_outline</span>
                <a href="mailto:support@kaammitra.com?subject=Help%20with%20Kaam%20Mitra" className="hover:text-white transition">Help Center</a>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">chat</span>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("open-kaam-mitra-chat"))}
                  className="hover:text-white transition text-left"
                >
                  Live Chat Support
                </button>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 text-neutral-400">security</span>
                <a href="mailto:support@kaammitra.com?subject=Privacy%20Policy%20Request" className="hover:text-white transition">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
          <p>&copy; {new Date().getFullYear()} Kaam Mitra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
