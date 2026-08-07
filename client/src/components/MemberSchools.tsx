import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { publicSelect } from "@/lib/rvcData";

interface PublicSchool {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  mascot: string | null;
  city: string | null;
  state: string | null;
  logo_path: string | null;
}

interface SchoolBrand {
  primary: string;
  secondary: string;
}

const schoolBrands: Record<string, SchoolBrand> = {
  beecher: { primary: "#F97316", secondary: "#111827" },
  central: { primary: "#1D4ED8", secondary: "#FFFFFF" },
  donovan: { primary: "#F5B335", secondary: "#111827" },
  "gardner-south-wilmington": { primary: "#F05A28", secondary: "#111827" },
  "grace-christian-academy": { primary: "#0B2D5C", secondary: "#D4AF37" },
  "grant-park": { primary: "#166534", secondary: "#FACC15" },
  "illinois-lutheran": { primary: "#1E3A8A", secondary: "#FACC15" },
  momence: { primary: "#B91C1C", secondary: "#FFFFFF" },
  "st-anne": { primary: "#B91C1C", secondary: "#111827" },
  "tri-point": { primary: "#1D4ED8", secondary: "#F59E0B" },
};

const defaultBrand: SchoolBrand = { primary: "#0F2A4A", secondary: "#D4AF37" };

function initials(name: string) {
  return name
    .replace(/High School|Christian Academy/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function MemberSchools() {
  const { data: schools, isLoading, error } = useQuery<PublicSchool[]>({
    queryKey: ["public-member-schools"],
    queryFn: () => publicSelect<PublicSchool[]>(
      "schools?is_active=eq.true&select=id,slug,name,short_name,mascot,city,state,logo_path&order=display_order.asc,name.asc",
    ),
    staleTime: 5 * 60_000,
  });

  return (
    <section id="schools" className="bg-section-gradient-3 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-12 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Member Schools</h2>
          <p className="text-lg text-gray-600">Ten distinct school communities, united through the River Valley Conference</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
            <p className="font-semibold text-amber-900">Member-school information is temporarily unavailable.</p>
            <p className="mt-1 text-sm text-amber-800">Please refresh the page in a moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {isLoading
              ? Array.from({ length: 10 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6 text-center">
                      <Skeleton className="mx-auto mb-4 h-20 w-20 rounded-full" />
                      <Skeleton className="mx-auto mb-2 h-6 w-3/4" />
                      <Skeleton className="mx-auto h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : schools?.map((school) => {
                  const brand = schoolBrands[school.slug] ?? defaultBrand;
                  const displayName = school.short_name ?? school.name;
                  const mascot = school.mascot ?? "RVC Member";

                  return (
                    <Link key={school.id} href={`/schools/${school.slug}`}>
                      <Card
                        className="group h-full cursor-pointer overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        style={{ borderTop: `6px solid ${brand.primary}` }}
                      >
                        <CardContent className="p-0 text-center">
                          <div
                            className="relative flex min-h-32 items-center justify-center overflow-hidden px-4 py-6"
                            style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})` }}
                          >
                            <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full border border-white/20 bg-white/10" />
                            <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full border border-white/20 bg-white/10" />
                            <div
                              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/70 bg-white text-2xl font-black shadow-lg"
                              style={{ color: brand.primary }}
                            >
                              {school.logo_path?.startsWith("http") ? (
                                <img src={school.logo_path} alt={`${school.name} logo`} className="h-full w-full object-contain p-1" loading="lazy" />
                              ) : (
                                initials(displayName)
                              )}
                            </div>
                          </div>

                          <div className="px-5 py-5">
                            <h3 className="text-lg font-bold leading-tight text-gray-950 group-hover:text-conference-navy">
                              {displayName}
                            </h3>
                            <p className="mt-2 text-sm font-black uppercase tracking-[0.16em]" style={{ color: brand.primary }}>
                              {mascot}
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`${displayName} school colors`}>
                              <span className="h-3 w-8 rounded-full border border-black/10" style={{ backgroundColor: brand.primary }} />
                              <span className="h-3 w-8 rounded-full border border-black/10" style={{ backgroundColor: brand.secondary }} />
                            </div>
                            {school.city && school.state && (
                              <p className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3.5 w-3.5" /> {school.city}, {school.state}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
          </div>
        )}
      </div>
    </section>
  );
}
