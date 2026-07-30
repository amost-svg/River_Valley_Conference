import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { publicSelect } from "@/lib/rvcData";
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

interface SchoolSummary {
  id: string;
  slug: string;
  name: string;
}

export default function Hero() {
  const { data: schools } = useQuery({
    queryKey: ["public-supabase-schools"],
    queryFn: () => publicSelect<SchoolSummary[]>("schools?is_active=eq.true&select=id,slug,name&order=display_order.asc"),
    staleTime: 5 * 60_000,
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
    { slug: "beecher", name: "Beecher", logo: beecherLogo },
    { slug: "central", name: "Central", logo: centralLogo },
    { slug: "donovan", name: "Donovan", logo: donovanLogo },
    { slug: "gardner-south-wilmington", name: "Gardner South Wilmington", logo: gardnerLogo },
    { slug: "grace-christian-academy", name: "Grace Christian Academy", logo: graceLogo },
    { slug: "grant-park", name: "Grant Park", logo: grantParkLogo },
    { slug: "illinois-lutheran", name: "Illinois Lutheran", logo: illinoisLutheranLogo },
    { slug: "momence", name: "Momence", logo: momenceLogo },
    { slug: "st-anne", name: "St. Anne", logo: stAnneLogo },
    { slug: "tri-point", name: "Tri-Point", logo: triPointLogo },
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
                const school = schools?.find((item) => item.slug === schoolLogo.slug);
                const logo = (
                  <div className="w-12 h-12 hover:scale-110 transition-transform cursor-pointer bg-white rounded-lg p-1 flex items-center justify-center">
                    <img
                      src={schoolLogo.logo}
                      alt={`${schoolLogo.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                );

                return school ? (
                  <Link key={school.id} href={`/schools/${school.id}`}>
                    {logo}
                  </Link>
                ) : (
                  <div key={schoolLogo.slug}>{logo}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
