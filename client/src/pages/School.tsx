import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatSchoolAddress,
  getPublicSchool,
  getSchoolLogoUrl,
} from "@/lib/schoolDirectory";

function ResourceButton({ url, label, icon }: { url: string | null; label: string; icon: React.ReactNode }) {
  if (!url) return null;
  return (
    <Button variant="outline" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {icon}
        {label}
        <ExternalLink className="ml-1 h-3.5 w-3.5" />
      </a>
    </Button>
  );
}

export default function SchoolPage() {
  const { id } = useParams<{ id: string }>();

  const schoolQuery = useQuery({
    queryKey: ["supabase", "school", id],
    queryFn: () => getPublicSchool(id),
    enabled: Boolean(id),
  });

  if (schoolQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-10 w-32" />
          <Card>
            <CardHeader><Skeleton className="h-24 w-full" /></CardHeader>
            <CardContent className="space-y-6"><Skeleton className="h-36 w-full" /><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (schoolQuery.error || !schoolQuery.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/#schools">
            <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Back to schools</Button>
          </Link>
          <Card><CardContent className="p-10 text-center"><h1 className="mb-3 text-3xl font-bold">School Not Found</h1><p className="text-muted-foreground">This member-school profile is unavailable.</p></CardContent></Card>
        </div>
      </div>
    );
  }

  const school = schoolQuery.data;
  const logoUrl = getSchoolLogoUrl(school.logo_path, school.slug);
  const address = formatSchoolAddress(school);
  const directionsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/#schools">
          <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Back to schools</Button>
        </Link>

        <Card className="overflow-hidden">
          <div className="h-2 bg-conference-green" />
          <CardHeader className="bg-gradient-to-br from-white to-slate-50">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${school.name} logo`} className="h-full w-full object-contain p-3" />
                  ) : (
                    <Building2 className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-3xl md:text-4xl">{school.name}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {school.mascot && <Badge className="bg-conference-gold text-conference-navy"><Trophy className="mr-1 h-3.5 w-3.5" />{school.mascot}</Badge>}
                    {school.city && school.state && <Badge variant="outline"><MapPin className="mr-1 h-3.5 w-3.5" />{school.city}, {school.state}</Badge>}
                  </div>
                </div>
              </div>
              {school.livestream_url && (
                <Button size="lg" asChild className="bg-red-600 hover:bg-red-700">
                  <a href={school.livestream_url} target="_blank" rel="noopener noreferrer">
                    <Play className="mr-2 h-5 w-5" />Watch {school.livestream_platform || "live"}
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-6 md:p-8">
            {school.mission_statement && (
              <section className="rounded-xl bg-conference-navy/5 p-6">
                <h2 className="mb-3 text-xl font-semibold text-conference-navy">Mission Statement</h2>
                <p className="leading-relaxed text-gray-700">{school.mission_statement}</p>
              </section>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-conference-navy"><MapPin className="h-5 w-5" />Contact Information</h2>
                <div className="space-y-4">
                  {address && (
                    <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-gray-500" /><div><p>{address}</p>{directionsUrl && <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Get directions</a>}</div></div>
                  )}
                  {school.phone && (
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-500" /><a href={`tel:${school.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">{school.phone}</a></div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-conference-navy"><Users className="h-5 w-5" />Administration</h2>
                <div className="space-y-4">
                  {school.superintendent_name && <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-500" /><span><span className="font-medium">Superintendent:</span> {school.superintendent_name}</span></div>}
                  {school.principal_name && <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-gray-500" /><span><span className="font-medium">Principal:</span> {school.principal_name}</span></div>}
                  {school.athletic_director_name && <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-gray-500" /><span><span className="font-medium">Athletic Director:</span> {school.athletic_director_name}</span></div>}
                </div>
              </section>
            </div>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-conference-navy">Links & Resources</h2>
              <div className="flex flex-wrap gap-3">
                <ResourceButton url={school.website_url} label="School Website" icon={<Globe className="mr-2 h-4 w-4" />} />
                <ResourceButton url={school.athletics_url} label="Athletics & Schedules" icon={<Trophy className="mr-2 h-4 w-4" />} />
                <ResourceButton url={school.ihsa_url} label="IHSA Profile" icon={<ShieldCheck className="mr-2 h-4 w-4" />} />
                <ResourceButton url={school.livestream_url} label={school.livestream_platform || "Livestream"} icon={<Play className="mr-2 h-4 w-4" />} />
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
