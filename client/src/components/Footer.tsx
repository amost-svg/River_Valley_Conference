import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

const rvcLogoPath = "/logos/rvc.png";

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 64;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const quickLinks = [
    { id: "home", label: "Home" },
    { id: "schedules", label: "Schedules & Results" },
    { id: "schools", label: "Member Schools" },
    { id: "about", label: "About RVC" },
    { id: "news", label: "News & Updates" },
    { id: "contact", label: "Contact" },
  ];

  const sports = [
    "Volleyball",
    "Soccer", 
    "Girls Basketball",
    "Boys Basketball",
    "Baseball",
    "Softball",
    "Track & Field",
    "Scholastic Bowl",
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/rivervalleyconference" },
    { icon: Twitter, href: "https://twitter.com/rvcathletics" },
    { icon: Instagram, href: "https://instagram.com/rivervalleyconference" },
    { icon: Youtube, href: "https://youtube.com/@rivervalleyconference" },
  ];

  return (
    <footer className="bg-conference-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Conference Info */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src={rvcLogoPath} 
                alt="RVC Logo" 
                className="h-8 w-8 mr-3 object-contain" 
              />
              <span className="font-bold text-xl">RVC</span>
            </div>
            <p className="text-gray-300 mb-4">
              The official IHSA athletic conference serving 10 member schools in northeastern Illinois, promoting excellence in high school athletics and academics.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a 
                    key={index}
                    href={social.href} 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button 
                    onClick={() => scrollToSection(link.id)}
                    className="text-gray-300 hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Sports</h3>
            <ul className="space-y-2 text-gray-300">
              {sports.map((sport, index) => (
                <li key={index}>{sport}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Serving northeastern Illinois<br />IHSA Conference Region</span>
              </p>
              <p className="flex items-center">
                <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                Contact form available above
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            &copy; 2025 River Valley Conference. All rights reserved. | 
            <Link href="/privacy-policy" className="hover:text-white transition-colors ml-1">Privacy Policy</Link> | 
            <Link href="/terms-of-use" className="hover:text-white transition-colors ml-1">Terms of Use</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
