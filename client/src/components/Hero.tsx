import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { School } from "@shared/schema";

export default function Hero() {
  const { data: schools } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

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

  // School logos in alphabetical order by school name
  const schoolLogos = [
    { name: "Beecher", logo: "/logos/beecher.png" },
    { name: "Central", logo: "/logos/central.png" },
    { name: "Donovan", logo: "/logos/donovan.png" },
    { name: "Gardner South Wilmington", logo: "/logos/gardner-south-wilmington.png" },
    { name: "Grace Christian Academy", logo: "/logos/grace-christian-academy.png" },
    { name: "Grant Park", logo: "/logos/grant-park.png" },
    { name: "Illinois Lutheran", logo: "/logos/illinois-lutheran.png" },
    { name: "Momence", logo: "/logos/momence.png" },
    { name: "St. Anne", logo: "/logos/st-anne.png" },
    { name: "Tri Point", logo: "/logos/tri-point.png" },
  ];

  return (
    <section id="home" className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-white text-white min-h-screen flex items-center">
      <div className="relative w-full h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center w-full py-20">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">River Valley Conference</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-50">Excellence in High School Athletics</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                onClick={() => scrollToSection("schedules")}
                className="bg-conference-gold text-conference-navy hover:bg-yellow-400 px-8 py-3 text-lg font-semibold"
              >
                View Schedules
              </Button>
              <Button 
                onClick={() => scrollToSection("schools")}
                variant="outline"
                className="border-2 border-white hover:bg-white hover:text-conference-navy px-8 py-3 text-lg font-semibold text-[#23252f]"
              >
                Member Schools
              </Button>
            </div>
            
            {/* School Logos - Hidden on mobile */}
            <div className="hidden md:flex justify-center items-center gap-6 mt-8">
              {schoolLogos.map((schoolLogo) => {
                const school = schools?.find(s => s.name === schoolLogo.name);
                if (!school) return null;
                
                return (
                  <Link key={school.id} href={`/schools/${school.id}`}>
                    <div className="w-12 h-12 hover:scale-110 transition-transform cursor-pointer bg-white rounded-lg p-1 flex items-center justify-center">
                      <img 
                        src={schoolLogo.logo} 
                        alt={`${schoolLogo.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
