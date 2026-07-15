import { useState, useEffect, useRef } from "react";
import { Database, Menu, Settings, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import rvcLogo from "@assets/RVC logo (3)_1754081720129.png";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
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
      ) setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) mobileMenuRef.current?.querySelector("button")?.focus();
  }, [isMenuOpen]);

  const goToSection = (sectionId: string) => {
    if (window.location.pathname !== "/") {
      window.location.assign(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) window.scrollTo({ top: element.offsetTop - 64, behavior: "smooth" });
    setIsMenuOpen(false);
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
    <nav className="sticky top-0 z-50 bg-conference-navy shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex flex-shrink-0 items-center">
            <img src={rvcLogo} alt="RVC Logo" className="mr-3 h-8 w-8" />
            <span className="text-xl font-bold text-white">River Valley Conference</span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => goToSection(item.id)} className="rounded-md px-2 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-conference-gold">
                  {item.label}
                </button>
              ))}
              <Link href="/conference/tournaments">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-white/10 hover:text-conference-gold">
                  <Trophy className="mr-2 h-4 w-4" /> Tournaments
                </Button>
              </Link>
              <Link href="/conference">
                <Button size="sm" className="ml-2 bg-conference-gold text-conference-navy hover:bg-yellow-400">
                  <Database className="mr-2 h-4 w-4" /> Conference Hub
                </Button>
              </Link>
              <Link href="/conference-admin">
                <Button variant="outline" size="sm" className="ml-1 border-conference-gold text-conference-gold hover:bg-conference-gold hover:text-conference-navy">
                  <Settings className="mr-2 h-4 w-4" /> Manage
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <Button
              ref={menuButtonRef}
              id="mobile-menu-button"
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="text-gray-300 hover:text-white"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
              data-testid="button-mobile-menu-toggle"
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <nav ref={mobileMenuRef} id="mobile-menu" className="border-t border-blue-800 bg-conference-navy md:hidden" aria-label="Mobile navigation">
          <ul className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button onClick={() => goToSection(item.id)} className="block min-h-[44px] w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-300 transition-colors hover:bg-blue-800 hover:text-white focus:bg-blue-800 focus:text-white focus:outline-none focus:ring-2 focus:ring-conference-gold">
                  {item.label}
                </button>
              </li>
            ))}
            <li className="mt-2 border-t border-blue-800 pt-2">
              <Link href="/conference/tournaments"><Button variant="outline" className="min-h-[44px] w-full border-white/30 text-white hover:bg-white/10" onClick={() => setIsMenuOpen(false)}><Trophy className="mr-2 h-4 w-4" /> Tournaments</Button></Link>
            </li>
            <li>
              <Link href="/conference"><Button className="min-h-[44px] w-full bg-conference-gold text-conference-navy hover:bg-yellow-400" onClick={() => setIsMenuOpen(false)}><Database className="mr-2 h-4 w-4" /> Conference Hub</Button></Link>
            </li>
            <li>
              <Link href="/conference-admin"><Button variant="outline" className="min-h-[44px] w-full border-conference-gold text-conference-gold hover:bg-conference-gold hover:text-conference-navy" onClick={() => setIsMenuOpen(false)}><Settings className="mr-2 h-4 w-4" /> Manage Conference</Button></Link>
            </li>
          </ul>
        </nav>
      )}
    </nav>
  );
}
