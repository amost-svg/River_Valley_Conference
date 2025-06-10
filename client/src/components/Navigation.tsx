import { useState } from "react";
import { Menu, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 64; // Account for sticky header
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "schools", label: "Schools" },
    { id: "schedules", label: "Schedules" },
    { id: "standings", label: "Standings" },
    { id: "news", label: "News" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <nav className="bg-conference-navy shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Trophy className="text-conference-gold h-8 w-8 mr-3" />
              <span className="text-white font-bold text-xl">River Valley Conference</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    index === 0 
                      ? "text-white hover:conference-gold" 
                      : "text-gray-300 hover:conference-gold"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-conference-navy border-t border-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
