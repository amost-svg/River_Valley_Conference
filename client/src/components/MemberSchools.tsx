import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, Phone, User, Building, Trophy, Play } from "lucide-react";
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full rounded-lg mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : schools?.map((school) => (
                <Card key={school.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{school.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy className="h-4 w-4 text-conference-gold" />
                          <span className="text-conference-gold font-medium">{school.mascot}</span>
                        </div>
                      </div>
                      {school.imageUrl && (
                        <img 
                          src={school.imageUrl} 
                          alt={`${school.name} logo`}
                          className="w-16 h-16 object-contain rounded-lg"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {school.city && school.state && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{school.city}, {school.state}</span>
                      </div>
                    )}
                    
                    {school.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{school.phoneNumber}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {school.superintendentName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Superintendent: {school.superintendentName}</span>
                        </div>
                      )}
                      {school.principalName && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Principal: {school.principalName}</span>
                        </div>
                      )}
                      {school.athleticDirectorName && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Athletic Director: {school.athleticDirectorName}</span>
                        </div>
                      )}
                    </div>

                    {school.missionStatement && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Mission Statement:</h4>
                        <p className="text-xs text-gray-700 leading-relaxed">{school.missionStatement}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {school.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={school.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Website
                          </a>
                        </Button>
                      )}
                      {school.athleticWebsite && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={school.athleticWebsite} target="_blank" rel="noopener noreferrer">
                            <Trophy className="h-3 w-3 mr-1" />
                            Athletics
                          </a>
                        </Button>
                      )}
                      {school.ihsaPageLink && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={school.ihsaPageLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            IHSA
                          </a>
                        </Button>
                      )}
                      {school.liveStreamingUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={school.liveStreamingUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-3 w-3 mr-1" />
                            Live Stream
                          </a>
                        </Button>
                      )}
                    </div>

                    {school.liveStreamingPlatform && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {school.liveStreamingPlatform}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          }
        </div>
      </div>
    </section>
  );
}
