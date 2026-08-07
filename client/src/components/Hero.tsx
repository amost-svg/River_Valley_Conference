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
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

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
    <section id="home" className="relative flex min-h-screen items-center bg-gradient-to-br from-blue-600 via-blue-700 to-white text-white">
      <div className="relative flex h-full w-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="w-full py-20 text-center">
            <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg md:text-6xl">River Valley Conference</h1>
            <p className="mb-8 text-xl text-blue-50 md:text-2xl">Excellence in High School Athletics</p>
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button onClick={() => scrollToSection("schedules")} className="bg-conference-gold px-8 py-3 text-lg font-semibold text-conference-navy hover:bg-yellow-400">
                View Schedules
              </Button>
              <Button onClick={() => scrollToSection("schools")} variant="outline" className="border-2 border-white px-8 py-3 text-lg font-semibold text-[#23252f] hover:bg-white hover:text-conference-navy">
                Member Schools
              </Button>
            </div>

            <div className="mt-8 hidden items-center justify-center gap-6 md:flex">
              {schoolLogos.map((schoolLogo) => {
                const school = schools?.find((item) => item.slug === schoolLogo.slug);
                const logo = (
                  <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg bg-white p-1 transition-transform hover:scale-110">
                    <img src={schoolLogo.logo} alt={`${schoolLogo.name} logo`} className="h-full w-full object-contain" />
                  </div>
                );

                return school ? (
                  <Link key={school.id} href={`/schools/${school.slug}`}>
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
