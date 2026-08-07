import { MapPin, Mail } from "lucide-react";
import { Link } from "wouter";
import rvcLogoPath from "@assets/RVC logo (3)_1754081720129.png";

interface QuickLink {
  label: string;
  sectionId?: string;
  href?: string;
}

export default function Footer() {
  const goToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      window.location.assign(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) window.scrollTo({ top: element.offsetTop - 64, behavior: "smooth" });
  };

  const quickLinks: QuickLink[] = [
    { sectionId: "home", label: "Home" },
    { sectionId: "schedules", label: "Schedules & Results" },
    { href: "/calendar", label: "Full Calendar" },
    { sectionId: "schools", label: "Member Schools" },
    { sectionId: "about", label: "About RVC" },
    { sectionId: "news", label: "News & Updates" },
    { sectionId: "contact", label: "Contact" },
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
    "Golf",
    "Math Competition",
    "Choir Festival",
    "Band Festival",
  ];

  return (
    <footer className="bg-conference-navy py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center">
              <img src={rvcLogoPath} alt="River Valley Conference logo" className="mr-3 h-8 w-8 object-contain" />
              <span className="text-xl font-bold">RVC</span>
            </div>
            <p className="text-gray-300">
              The official website of the River Valley Conference, serving 10 IHSA member schools in northeastern Illinois through athletics, academics, and fine-arts competition.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link href={link.href} className="text-gray-300 transition-colors hover:text-white">{link.label}</Link>
                  ) : (
                    <button onClick={() => link.sectionId && goToSection(link.sectionId)} className="text-left text-gray-300 transition-colors hover:text-white">
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Sports & Activities</h3>
            <ul className="space-y-2 text-gray-300">
              {sports.map((sport) => <li key={sport}>{sport}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Conference Contact</h3>
            <div className="space-y-3 text-gray-300">
              <p className="flex items-start">
                <MapPin className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>Serving member schools across northeastern Illinois</span>
              </p>
              <button onClick={() => goToSection("contact")} className="flex items-center text-left transition-colors hover:text-white">
                <Mail className="mr-2 h-5 w-5 flex-shrink-0" />
                Send a message through the conference contact form
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-blue-800 pt-8 text-center">
          <p className="text-gray-300">
            &copy; {new Date().getFullYear()} River Valley Conference. All rights reserved. |
            <Link href="/privacy-policy" className="ml-1 transition-colors hover:text-white">Privacy Policy</Link> |
            <Link href="/terms-of-use" className="ml-1 transition-colors hover:text-white">Terms of Use</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
