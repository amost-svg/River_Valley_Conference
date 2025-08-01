import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { School } from "@shared/schema";
import beecherLogo from "@assets/Beecher High School Logo.png";
import centralLogo from "@assets/Clifton Central Logo.png";
import donovanLogo from "@assets/Donovan Logo.png";
import gardnerLogo from "@assets/Gardener South Wilmington Logo.png";
import graceLogo from "@assets/Grace Christian Academy Logo.png";
import grantParkLogo from "@assets/Grant Park Logo.png";
import illinoisLutheranLogo from "@assets/Illinois Lutheran Logo.png";
import momenceLogo from "@assets/Momence Logo.png";
import stAnneLogo from "@assets/St Anne Logo.png";
import triPointLogo from "@assets/Tri Point Logo.png";

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
    { name: "Beecher", logo: beecherLogo },
    { name: "Central", logo: centralLogo },
    { name: "Donovan", logo: donovanLogo },
    { name: "Gardner South Wilmington", logo: gardnerLogo },
    { name: "Grace Christian Academy", logo: graceLogo },
    { name: "Grant Park", logo: grantParkLogo },
    { name: "Illinois Lutheran", logo: illinoisLutheranLogo },
    { name: "Momence", logo: momenceLogo },
    { name: "St. Anne", logo: stAnneLogo },
    { name: "Tri Point", logo: triPointLogo },
  ];

  return (
    <section id="home" className="relative bg-conference-navy text-white">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div 
        className="relative bg-cover bg-center h-96" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      >
        <div className="absolute inset-0 bg-conference-navy bg-opacity-80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">River Valley Conference</h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">Excellence in High School Athletics</p>
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
