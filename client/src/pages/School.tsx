import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, MapPin, Phone, User, Building, Trophy, Play, Mail, Globe } from "lucide-react";
import type { School } from "@shared/schema";

export default function SchoolPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: school, isLoading, error } = useQuery<School>({
    queryKey: ["/api/schools", id],
    queryFn: async () => {
      const response = await fetch(`/api/schools/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch school");
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">School Not Found</h1>
            <p className="text-red-600">Sorry, we couldn't find this school. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="w-32 h-10 mb-6" />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="w-24 h-24 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">School Not Found</h1>
            <p className="text-gray-600">This school doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{school.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="h-5 w-5 text-conference-gold" />
                  <span className="text-conference-gold font-medium text-lg">{school.mascot}</span>
                </div>
              </div>
              {school.imageUrl && (
                <img 
                  src={school.imageUrl} 
                  alt={`${school.name} logo`}
                  className="w-24 h-24 object-contain rounded-lg"
                />
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Mission Statement */}
            {school.missionStatement && (
              <div className="bg-conference-navy/5 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-3 text-conference-navy">Mission Statement</h3>
                <p className="text-gray-700 leading-relaxed">{school.missionStatement}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-xl mb-4 text-conference-navy">Contact Information</h3>
                <div className="space-y-3">
                  {school.city && school.state && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span>{school.city}, {school.state}</span>
                    </div>
                  )}
                  
                  {school.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span>{school.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Administration */}
              <div>
                <h3 className="font-semibold text-xl mb-4 text-conference-navy">Administration</h3>
                <div className="space-y-3">
                  {school.superintendentName && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <span>Superintendent: {school.superintendentName}</span>
                    </div>
                  )}
                  {school.principalName && (
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <span>Principal: {school.principalName}</span>
                    </div>
                  )}
                  {school.athleticDirectorName && (
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-gray-500" />
                      <span>Athletic Director: {school.athleticDirectorName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Links and Resources */}
            <div>
              <h3 className="font-semibold text-xl mb-4 text-conference-navy">Links & Resources</h3>
              <div className="flex flex-wrap gap-3">
                {school.website && (
                  <Button variant="outline" asChild>
                    <a href={school.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      School Website
                    </a>
                  </Button>
                )}
                {school.athleticWebsite && (
                  <Button variant="outline" asChild>
                    <a href={school.athleticWebsite} target="_blank" rel="noopener noreferrer">
                      <Trophy className="h-4 w-4 mr-2" />
                      Athletics Website
                    </a>
                  </Button>
                )}
                {school.ihsaPageLink && (
                  <Button variant="outline" asChild>
                    <a href={school.ihsaPageLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      IHSA Page
                    </a>
                  </Button>
                )}
                {school.liveStreamingUrl && (
                  <Button variant="outline" asChild>
                    <a href={school.liveStreamingUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Live Stream
                    </a>
                  </Button>
                )}
              </div>
              
              {school.liveStreamingPlatform && (
                <div className="mt-4">
                  <Badge variant="secondary">
                    Streaming Platform: {school.liveStreamingPlatform}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}