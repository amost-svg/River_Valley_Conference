import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import type { News } from "@shared/schema";

export default function NewsAnnouncements() {
  const { data: news, isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sports':
        return 'bg-conference-navy text-white';
      case 'academic':
        return 'bg-conference-green text-white';
      case 'soccer':
        return 'bg-conference-gold text-white';
      case 'track':
        return 'bg-red-500 text-white';
      case 'volleyball':
        return 'bg-purple-500 text-white';
      case 'awards':
        return 'bg-conference-gold text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (error) {
    return (
      <section id="news" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest News</h2>
            <p className="text-red-600">Failed to load news. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="news" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest News</h2>
          <p className="text-lg text-gray-600">Stay informed with conference updates and announcements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-2">
                      <Skeleton className="h-6 w-16 mr-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-full mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            : news?.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <img 
                    src={article.imageUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"} 
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center mb-2">
                      <Badge className={`text-xs px-2 py-1 rounded ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </Badge>
                      <span className="text-gray-500 text-sm ml-2">
                        {formatDate(article.publishDate)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{article.title}</h3>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <button className="conference-navy font-semibold hover:text-blue-700 transition-colors flex items-center">
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              ))
          }
        </div>

        <div className="text-center mt-12">
          <Button className="bg-conference-navy text-white hover:bg-blue-800 px-8 py-3 text-lg font-semibold">
            View All News
          </Button>
        </div>
      </div>
    </section>
  );
}
