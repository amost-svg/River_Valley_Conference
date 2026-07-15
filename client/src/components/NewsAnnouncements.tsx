import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, FileText, Newspaper } from "lucide-react";
import { publicSelect } from "@/lib/rvcData";

interface PublicNewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  image_path: string | null;
  pdf_path: string | null;
  published_at: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "Conference update";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function categoryClass(category: string | null) {
  switch (category?.toLowerCase()) {
    case "academic":
      return "bg-emerald-100 text-emerald-800";
    case "awards":
      return "bg-amber-100 text-amber-800";
    case "athletics":
      return "bg-blue-100 text-blue-800";
    case "conference":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function NewsAnnouncements() {
  const { data: news, isLoading, error } = useQuery<PublicNewsItem[]>({
    queryKey: ["public-news-items"],
    queryFn: () => publicSelect<PublicNewsItem[]>(
      "news_items?status=eq.published&select=id,title,slug,excerpt,body,category,image_path,pdf_path,published_at&order=published_at.desc&limit=6",
    ),
    staleTime: 5 * 60_000,
  });

  return (
    <section id="news" className="bg-section-gradient-4 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-divider mb-12 pb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Latest News</h2>
          <p className="text-lg text-gray-600">Conference honors, announcements, and official releases</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
            <p className="font-semibold text-amber-900">Conference news is temporarily unavailable.</p>
            <p className="mt-1 text-sm text-amber-800">Please refresh the page in a moment.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
                  <Skeleton className="mb-3 h-5 w-28" />
                  <Skeleton className="mb-3 h-7 w-full" />
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : news?.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => {
              const destination = article.pdf_path?.startsWith("http") ? article.pdf_path : null;
              const card = (
                <Card className="group h-full overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-1.5 bg-gradient-to-r from-conference-navy via-blue-600 to-conference-gold" />
                  <CardContent className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-conference-navy/10 text-conference-navy">
                        {destination ? <FileText className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                      </div>
                      {destination && <ArrowUpRight className="h-5 w-5 text-gray-400 transition group-hover:text-conference-navy" />}
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className={`border-0 text-xs ${categoryClass(article.category)}`}>{article.category ?? "Conference"}</Badge>
                      <span className="text-xs text-gray-500">{formatDate(article.published_at)}</span>
                    </div>
                    <h3 className="text-xl font-bold leading-snug text-gray-950 group-hover:text-conference-navy">{article.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{article.excerpt ?? article.body ?? "Open the official conference release."}</p>
                    {destination && <p className="mt-5 text-sm font-semibold text-conference-navy">View official PDF</p>}
                  </CardContent>
                </Card>
              );

              return destination ? (
                <a key={article.id} href={destination} target="_blank" rel="noreferrer" className="block h-full">{card}</a>
              ) : (
                <div key={article.id}>{card}</div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <Newspaper className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="font-semibold text-slate-900">Conference news will appear here as it is published.</p>
          </div>
        )}
      </div>
    </section>
  );
}
