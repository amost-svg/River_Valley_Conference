import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchoolLogoUrl, listPublicSchools } from "@/lib/schoolDirectory";

export default function MemberSchools() {
  const { data: schools, isLoading, error } = useQuery({
    queryKey: ["supabase", "schools"],
    queryFn: listPublicSchools,
  });

  if (error) {
    return (
      <section id="schools" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Member Schools</h2>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load schools. Please try again later."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="schools" className="bg-section-gradient-3 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-12 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Member Schools</h2>
          <p className="text-lg text-gray-600">Meet the ten schools of the River Valley Conference</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
                <Card key={index} className="transition-shadow hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <Skeleton className="mx-auto mb-4 h-20 w-20 rounded-lg" />
                    <Skeleton className="mx-auto mb-2 h-6 w-3/4" />
                    <Skeleton className="mx-auto h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : schools?.map((school) => {
                const logoUrl = getSchoolLogoUrl(school.logo_path, school.slug);
                return (
                  <Link key={school.id} href={`/schools/${school.slug}`}>
                    <Card className="card-hover h-full cursor-pointer border-t-4 border-t-conference-green shadow-green transition-all duration-300 hover:shadow-lg">
                      <CardContent className="flex h-full flex-col items-center p-6 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-white">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${school.name} logo`}
                              className="h-full w-full object-contain p-2"
                              loading="lazy"
                              width="80"
                              height="80"
                              decoding="async"
                            />
                          ) : (
                            <Building2 className="h-9 w-9 text-gray-400" />
                          )}
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">{school.name}</h3>
                        <p className="font-medium text-conference-gold">{school.mascot || "RVC Member"}</p>
                        {school.city && school.state && (
                          <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {school.city}, {school.state}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
