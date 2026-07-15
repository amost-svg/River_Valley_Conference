import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building, ExternalLink, Globe, MapPin, Phone, Play, Trophy, User } from "lucide-react";
import { publicSelect } from "@/lib/rvcData";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface PublicSchool {
  id: string;
  name: string;
  short_name: string | null;
  mascot: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  superintendent_name: string | null;
  principal_name: string | null;
  athletic_director_name: string | null;
  website_url: string | null;
  athletics_url: string | null;
  ihsa_url: string | null;
  livestream_url: string | null;
  livestream_platform: string | null;
  mission_statement: string | null;
  logo_path: string | null;
}

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

export default function SchoolPage() {
  const { id } = useParams<{ id: string }>();
  const { data: school, isLoading, error } = useQuery<PublicSchool | null>({
    queryKey: ["public-school", id],
    queryFn: async () => {
      const rows = await publicSelect<PublicSchool[]>(
        `schools?id=eq.${encodeURIComponent(id)}&is_active=eq.true&select=id,name,short_name,mascot,address_line1,city,state,postal_code,phone,superintendent_name,principal_name,athletic_director_name,website_url,athletics_url,ihsa_url,livestream_url,livestream_platform,mission_statement,logo_path&limit=1`,
      );
      return rows[0] ?? null;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/#schools">
          <Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Member Schools</Button>
        </Link>

        {isLoading ? (
          <Card><CardContent className="space-y-5 p-8"><Skeleton className="h-24 w-24 rounded-full" /><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-36 w-full" /></CardContent></Card>
        ) : error || !school ? (
          <Card><CardContent className="p-10 text-center"><h1 className="text-2xl font-bold text-slate-950">School profile unavailable</h1><p className="mt-2 text-slate-600">Please return to the member-school directory and try again.</p></CardContent></Card>
        ) : (
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="h-3 bg-gradient-to-r from-conference-navy via-blue-600 to-conference-gold" />
            <CardHeader className="border-b border-slate-200 bg-white p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-conference-navy to-blue-600 text-3xl font-black text-white shadow-lg">
                  {school.logo_path?.startsWith("http") ? <img src={school.logo_path} alt={`${school.name} logo`} className="h-full w-full object-contain bg-white p-1" /> : initials(school.short_name ?? school.name)}
                </div>
                <div>
                  <CardTitle className="text-3xl text-slate-950 sm:text-4xl">{school.name}</CardTitle>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-conference-gold"><Trophy className="h-5 w-5" /> {school.mascot}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 p-8">
              {school.mission_statement && (
                <section className="rounded-xl bg-conference-navy/5 p-6">
                  <h2 className="text-lg font-bold text-conference-navy">Mission Statement</h2>
                  <p className="mt-3 leading-7 text-slate-700">{school.mission_statement}</p>
                </section>
              )}

              <div className="grid gap-8 md:grid-cols-2">
                <section>
                  <h2 className="text-lg font-bold text-conference-navy">Contact Information</h2>
                  <div className="mt-4 space-y-4 text-slate-700">
                    {(school.address_line1 || school.city) && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-slate-400" /><span>{school.address_line1 && <>{school.address_line1}<br /></>}{school.city}, {school.state} {school.postal_code}</span></div>}
                    {school.phone && <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-slate-400" /><a href={`tel:${school.phone}`} className="hover:text-conference-navy hover:underline">{school.phone}</a></div>}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-conference-navy">Administration</h2>
                  <div className="mt-4 space-y-4 text-slate-700">
                    {school.superintendent_name && <div className="flex items-center gap-3"><User className="h-5 w-5 text-slate-400" /><span>Superintendent: {school.superintendent_name}</span></div>}
                    {school.principal_name && <div className="flex items-center gap-3"><Building className="h-5 w-5 text-slate-400" /><span>Principal: {school.principal_name}</span></div>}
                    {school.athletic_director_name && <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-slate-400" /><span>Athletic Director: {school.athletic_director_name}</span></div>}
                  </div>
                </section>
              </div>

              <section>
                <h2 className="text-lg font-bold text-conference-navy">Links & Resources</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {school.website_url && <Button variant="outline" asChild><a href={school.website_url} target="_blank" rel="noreferrer"><Globe className="mr-2 h-4 w-4" /> School Website</a></Button>}
                  {school.athletics_url && <Button variant="outline" asChild><a href={school.athletics_url} target="_blank" rel="noreferrer"><Trophy className="mr-2 h-4 w-4" /> Athletics</a></Button>}
                  {school.ihsa_url && <Button variant="outline" asChild><a href={school.ihsa_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> IHSA Page</a></Button>}
                  {school.livestream_url && <Button variant="outline" asChild><a href={school.livestream_url} target="_blank" rel="noreferrer"><Play className="mr-2 h-4 w-4" /> Live Stream</a></Button>}
                </div>
                {school.livestream_platform && <Badge variant="secondary" className="mt-4">Streaming platform: {school.livestream_platform}</Badge>}
              </section>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
