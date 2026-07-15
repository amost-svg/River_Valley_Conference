import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Megaphone, Newspaper } from "lucide-react";
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
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function categoryClass(category: string | null) {
  switch (category?.toLowerCase()) {
    case "academics":
    case "academic":
      return "bg-emerald-100 text-emerald-800";
    case "athletics":
      return "bg-blue-100 text-blue-800";
    case "event recap":
      return "bg-amber-100 text-amber-800";
    case "schedule update":
      return "bg-red-100 text-red-800";
    default:
      return "bg-purple-100 text-purple-800";
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
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Conference News & Announcements</h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Public statements, event recaps, schedule announcements, and stories from across the River Valley Conference
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
            <p className="font-semibold text-amber-900">Conference news is temporarily unavailable.</p>
            <p className="mt-1 text-sm text-amber-800">Please refresh the page in a moment.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
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
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
            {news.map((article) => (
              <Card key={article.id} className="overflow-hidden border-0 shadow-md">
                {article.image_path?.startsWith("http") && (
                  <img src={article.image_path} alt="" className="h-56 w-full object-cover" loading="lazy" />
                )}
                <div className="h-1.5 bg-gradient-to-r from-conference-navy via-blue-600 to-conference-gold" />
                <CardContent className="p-7">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-conference-navy/10 text-conference-navy">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(article.published_at)}</span>
                  </div>
                  <Badge className={`mb-3 border-0 text-xs ${categoryClass(article.category)}`}>{article.category ?? "Conference Update"}</Badge>
                  <h3 className="text-2xl font-bold leading-snug text-gray-950">{article.title}</h3>
                  <p className="mt-4 text-base leading-7 text-gray-600">{article.excerpt ?? "Read the latest official update from the River Valley Conference."}</p>

                  {article.body && (
                    <details className="group mt-5 rounded-lg border border-slate-200 bg-slate-50">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-conference-navy">
                        <span className="group-open:hidden">Read full announcement</span>
                        <span className="hidden group-open:inline">Close announcement</span>
                      </summary>
                      <div className="whitespace-pre-wrap border-t border-slate-200 px-4 py-4 text-sm leading-7 text-slate-700">{article.body}</div>
                    </details>
                  )}

                  {article.pdf_path?.startsWith("http") && (
                    <a href={article.pdf_path} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-conference-navy hover:underline">
                      Supporting information <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
            <Newspaper className="mx-auto mb-4 h-9 w-9 text-slate-400" />
            <p className="text-lg font-semibold text-slate-900">No conference announcement has been published yet.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              When the RVC publishes a statement, event recap, schedule update, or conference-wide story, it will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
