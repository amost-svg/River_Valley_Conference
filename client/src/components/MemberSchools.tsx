import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { School } from "@shared/schema";

export default function MemberSchools() {
  const { data: schools, isLoading, error } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  if (error) {
    return (
      <section id="schools" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Member Schools</h2>
            <p className="text-red-600">Failed to load schools. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="schools" className="py-16 bg-section-gradient-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 section-divider pb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Member Schools</h2>
          <p className="text-lg text-gray-600">Our conference is proud to represent these outstanding high schools</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Skeleton className="w-20 h-20 mx-auto rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </CardContent>
                </Card>
              ))
            : schools?.map((school) => (
                <Link key={school.id} href={`/schools/${school.id}`}>
                  <Card className="card-hover shadow-green hover:shadow-lg transition-all duration-300 cursor-pointer border-t-4 border-t-conference-green">
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        {school.imageUrl ? (
                          <img 
                            src={school.imageUrl} 
                            alt={`${school.name} logo`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Logo</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{school.name}</h3>
                      <p className="text-conference-gold text-sm font-medium">{school.mascot}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
          }
        </div>
      </div>
    </section>
  );
}
