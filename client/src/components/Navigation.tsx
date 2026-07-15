import { useState, useEffect, useRef } from "react";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const rvcLogo = "/logos/rvc.png";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !menuButtonRef.current?.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (isMenuOpen) {
      // Focus first menu item when menu opens
      const firstMenuItem = mobileMenuRef.current?.querySelector('button');
      firstMenuItem?.focus();
    }
  }, [isMenuOpen]);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
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
              <img src={rvcLogo} alt="RVC Logo" className="h-8 w-8 mr-3" />
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
              <Link href="/admin">
                <Button variant="outline" size="sm" className="ml-4 text-conference-gold border-conference-gold hover:bg-conference-gold hover:text-conference-navy">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              ref={menuButtonRef}
              id="mobile-menu-button"
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
              data-testid="button-mobile-menu-toggle"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav
          ref={mobileMenuRef}
          id="mobile-menu"
          className="md:hidden bg-conference-navy border-t border-blue-800"
          aria-label="Mobile navigation"
        >
          <ul className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item, index) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className="text-gray-300 hover:text-white hover:bg-blue-800 focus:bg-blue-800 focus:text-white focus:outline-none focus:ring-2 focus:ring-conference-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left min-h-[44px] transition-colors"
                  tabIndex={0}
                  data-testid={`button-nav-${item.id}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      scrollToSection(item.id);
                    }
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
            <li className="border-t border-blue-800 mt-2 pt-2">
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-conference-gold border-conference-gold hover:bg-conference-gold hover:text-conference-navy focus:bg-conference-gold focus:text-conference-navy focus:outline-none focus:ring-2 focus:ring-conference-gold min-h-[44px]"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid="button-nav-admin"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </nav>
  );
}
