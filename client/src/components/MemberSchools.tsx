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

const accentClasses = [
  "from-blue-700 to-blue-500",
  "from-emerald-700 to-emerald-500",
  "from-amber-600 to-orange-500",
  "from-purple-700 to-fuchsia-500",
  "from-red-700 to-rose-500",
];

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
          <p className="text-lg text-gray-600">Ten schools working together in athletics, academics, music, and conference life</p>
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
              : schools?.map((school, index) => (
                  <Link key={school.id} href={`/schools/${school.id}`}>
                    <Card className="group h-full cursor-pointer overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                      <div className={`h-2 bg-gradient-to-r ${accentClasses[index % accentClasses.length]}`} />
                      <CardContent className="p-6 text-center">
                        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${accentClasses[index % accentClasses.length]} text-2xl font-black text-white shadow-md`}>
                          {school.logo_path?.startsWith("http") ? (
                            <img src={school.logo_path} alt={`${school.name} logo`} className="h-full w-full object-contain bg-white p-1" loading="lazy" />
                          ) : (
                            initials(school.short_name ?? school.name)
                          )}
                        </div>
                        <h3 className="text-lg font-bold leading-tight text-gray-950 group-hover:text-conference-navy">
                          {school.short_name ?? school.name}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-conference-gold">{school.mascot}</p>
                        {school.city && school.state && (
                          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5" /> {school.city}, {school.state}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
