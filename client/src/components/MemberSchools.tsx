import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <section id="schools" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Member Schools</h2>
          <p className="text-lg text-gray-600">Our conference is proud to represent these outstanding high schools</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Skeleton className="w-full h-40 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                    <Skeleton className="h-4 w-2/3 mx-auto" />
                  </CardContent>
                </Card>
              ))
            : schools?.map((school) => (
                <Card key={school.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <img 
                      src={school.imageUrl || "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
                      alt={school.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-lg mb-2">{school.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{school.mascot}</p>
                    <p className="text-gray-500 text-sm">{school.location}</p>
                  </CardContent>
                </Card>
              ))
          }
        </div>
      </div>
    </section>
  );
}
