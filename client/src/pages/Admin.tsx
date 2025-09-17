import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth, endOfMonth, isToday } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Calendar, 
  Users, 
  Trophy, 
  FileText, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Eye,
  ImageIcon,
  FileIcon,
  X,
  LogOut,
  User as UserIcon,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { School, Sport, Game, News, GameResultSubmission, User, NewsUpdated } from "@shared/schema";
import { insertGameSchema, insertNewsSchema, insertNewsUpdatedSchema } from "@shared/schema";
import SchoolEditor from "@/components/SchoolEditor";
import ScheduleUploader from "@/components/ScheduleUploader";
import SuperAdminPanel from "@/components/SuperAdminPanel";
import rvcLogoPath from "@assets/RVC logo (3)_1754075250117.png";

// Form schemas
const gameSchema = insertGameSchema.extend({
  homeTeamId: z.number().min(1, "Please select a home team"),
  awayTeamId: z.number().min(1, "Please select an away team"),
  sportId: z.number().min(1, "Please select a sport"),
});

const newsSchema = insertNewsSchema.extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

// Enhanced news schema for the new system
const enhancedNewsSchema = insertNewsUpdatedSchema.extend({
  title: z.string().min(1, "Title is required"),
  authorId: z.number().min(1, "Author is required"),
});

// Game result schema for Athletic Directors
const gameResultSchema = z.object({
  gameId: z.number(),
  homeScore: z.number().min(0, "Score must be 0 or greater"),
  awayScore: z.number().min(0, "Score must be 0 or greater"),
  gameSummary: z.string().optional(),
  keyPlayers: z.string().optional(),
  gameHighlights: z.string().optional(),
  nextGameInfo: z.string().optional(),
  recordAfterGame: z.string().optional(),
  conferenceRecord: z.string().optional(),
});

// PDF article schema  
const pdfArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"), 
  excerpt: z.string().optional(),
});

type GameFormData = z.infer<typeof gameSchema>;
type NewsFormData = z.infer<typeof newsSchema>;
type EnhancedNewsFormData = z.infer<typeof enhancedNewsSchema>;
type GameResultFormData = z.infer<typeof gameResultSchema>;
type PdfArticleFormData = z.infer<typeof pdfArticleSchema>;

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isGameResultDialogOpen, setIsGameResultDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("all");
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Data queries
  const { data: schools } = useQuery<School[]>({ queryKey: ["/api/schools"] });
  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: games } = useQuery<Game[]>({ queryKey: ["/api/games"] });
  const { data: news } = useQuery<News[]>({ queryKey: ["/api/news"] });
  const { data: enhancedNews } = useQuery<(NewsUpdated & { author: User })[]>({ 
    queryKey: ["/api/news-updated"] 
  });
  const { data: submissions } = useQuery<GameResultSubmission[]>({ 
    queryKey: ["/api/admin/game-result-submissions"] 
  });

  // Forms
  const gameForm = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      homeTeamId: 0,
      awayTeamId: 0,
      sportId: 0,
      gameDate: new Date(),
      gameTime: "",
      homeScore: 0,
      awayScore: 0,
      isCompleted: false,
    },
  });

  const newsForm = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "General",
      publishDate: new Date(),
      imageUrl: "",
    },
  });

  const enhancedNewsForm = useForm<EnhancedNewsFormData>({
    resolver: zodResolver(enhancedNewsSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "General",
      publishDate: new Date(),
      imageUrl: "",
      pdfUrl: "",
      authorId: 1, // Default to first user, should be dynamic in production
      isPublished: true,
    },
  });

  const pdfForm = useForm<PdfArticleFormData>({
    resolver: zodResolver(pdfArticleSchema),
    defaultValues: {
      title: "",
      category: "General",
      excerpt: "",
    },
  });

  const gameResultForm = useForm<GameResultFormData>({
    resolver: zodResolver(gameResultSchema),
    defaultValues: {
      gameId: 0,
      homeScore: 0,
      awayScore: 0,
      gameSummary: "",
      keyPlayers: "",
      gameHighlights: "",
      nextGameInfo: "",
      recordAfterGame: "",
      conferenceRecord: "",
    },
  });

  // File handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPdf(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const clearPdf = () => {
    setSelectedPdf(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const resetNewsForm = () => {
    enhancedNewsForm.reset();
    clearImage();
    clearPdf();
    setIsNewsDialogOpen(false);
  };

  const resetPdfForm = () => {
    pdfForm.reset();
    clearPdf();
    setIsPdfDialogOpen(false);
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation("/login");
    },
    onError: () => {
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Mutations
  const createGameMutation = useMutation({
    mutationFn: async (data: GameFormData) => {
      return apiRequest("POST", "/api/admin/games", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Game created successfully" });
      gameForm.reset();
      setIsGameDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create game", variant: "destructive" });
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: NewsFormData) => {
      return apiRequest("POST", "/api/admin/news", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "News article created successfully" });
      newsForm.reset();
      setIsNewsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create news article", variant: "destructive" });
    },
  });

  // Enhanced news mutation with file uploads
  const createEnhancedNewsMutation = useMutation({
    mutationFn: async (data: EnhancedNewsFormData) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      if (selectedPdf) {
        formData.append('pdf', selectedPdf);
      }

      const response = await fetch('/api/admin/news-enhanced', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create news article');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Enhanced news article created successfully" });
      resetNewsForm();
      queryClient.invalidateQueries({ queryKey: ["/api/news-updated"] });
    },
    onError: (error) => {
      console.error("Enhanced news creation error:", error);
      toast({ title: "Error", description: "Failed to create enhanced news article", variant: "destructive" });
    },
  });

  // PDF-only article mutation
  const createPdfArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedPdf) {
        throw new Error('No PDF file selected');
      }

      const formData = new FormData();
      formData.append('data', JSON.stringify({
        ...data,
        authorId: 1, // Default to first user
        publishDate: new Date(),
        isPublished: true,
        content: data.excerpt || `PDF Document: ${selectedPdf.name}`,
      }));
      formData.append('pdf', selectedPdf);

      const response = await fetch('/api/admin/news-enhanced', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create PDF article');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "PDF article created successfully" });
      resetPdfForm();
      queryClient.invalidateQueries({ queryKey: ["/api/news-updated"] });
    },
    onError: (error) => {
      console.error("PDF article creation error:", error);
      toast({ title: "Error", description: "Failed to create PDF article", variant: "destructive" });
    },
  });

  // Game result submission mutation  
  const submitGameResultMutation = useMutation({
    mutationFn: async (data: GameResultFormData) => {
      return apiRequest("POST", "/api/admin/game-results", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Game result saved successfully" });
      setIsGameResultDialogOpen(false);
      gameResultForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
    onError: (error) => {
      console.error("Game result submission error:", error);
      toast({ title: "Error", description: "Failed to save game result", variant: "destructive" });
    },
  });

  const moderateSubmissionMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return apiRequest("POST", `/api/admin/game-result-submissions/${id}/moderate`, {
        moderatedBy: 1, // In production, use actual admin user ID
        notes,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Submission moderated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to moderate submission", variant: "destructive" });
    },
  });

  // Standings recalculation mutation
  const recalculateStandingsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/recalculate-standings", {});
    },
    onSuccess: (data) => {
      toast({ 
        title: "Standings Updated", 
        description: `${data.message}. Created ${data.standingsCreated} standings entries.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to recalculate standings. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  const onSubmitGame = (data: GameFormData) => {
    createGameMutation.mutate(data);
  };

  const onSubmitNews = (data: NewsFormData) => {
    createNewsMutation.mutate(data);
  };

  const onSubmitEnhancedNews = (data: EnhancedNewsFormData) => {
    createEnhancedNewsMutation.mutate(data);
  };

  const onSubmitPdfArticle = (data: any) => {
    createPdfArticleMutation.mutate(data);
  };

  const onSubmitGameResult = (data: GameResultFormData) => {
    submitGameResultMutation.mutate(data);
  };

  // Helper functions for Results tab
  const openGameResultDialog = (game: Game) => {
    setSelectedGame(game);
    gameResultForm.reset({
      gameId: game.id,
      homeScore: game.homeScore || 0,
      awayScore: game.awayScore || 0,
      gameSummary: game.gameSummary || "",
      keyPlayers: game.keyPlayers || "",
      gameHighlights: game.gameHighlights || "",
      nextGameInfo: game.nextGameInfo || "",
      recordAfterGame: game.recordAfterGame || "",
      conferenceRecord: game.conferenceRecord || "",
    });
    setIsGameResultDialogOpen(true);
  };

  // Helper function to get games for a specific date
  const getGamesForDate = (date: Date) => {
    if (!games) return [];
    return games.filter((game) => {
      const gameDate = new Date(game.gameDate);
      return isSameDay(gameDate, date);
    });
  };

  // Helper function to get games with school and sport filters
  const getFilteredGamesForDate = (date: Date) => {
    const dayGames = getGamesForDate(date);
    return dayGames.filter((game) => {
      const schoolMatch = selectedSchoolFilter === "all" || 
        game.homeTeamId?.toString() === selectedSchoolFilter || 
        game.awayTeamId?.toString() === selectedSchoolFilter;
      
      const sportMatch = selectedSportFilter === "all" || 
        game.sportId?.toString() === selectedSportFilter;
      
      return schoolMatch && sportMatch;
    });
  };

  // Get dates that have games for calendar highlighting
  const getGameDates = () => {
    if (!games) return [];
    return games.map(game => new Date(game.gameDate));
  };

  // Filtered games for Results tab (keeping original logic)
  const filteredGames = useMemo(() => {
    if (!games) return [];
    
    return games.filter((game) => {
      const schoolMatch = selectedSchoolFilter === "all" || 
        game.homeTeamId?.toString() === selectedSchoolFilter || 
        game.awayTeamId?.toString() === selectedSchoolFilter;
      
      const sportMatch = selectedSportFilter === "all" || 
        game.sportId?.toString() === selectedSportFilter;
      
      return schoolMatch && sportMatch;
    });
  }, [games, selectedSchoolFilter, selectedSportFilter]);

  const moderateSubmission = (id: number, notes?: string) => {
    moderateSubmissionMutation.mutate({ id, notes });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 relative"
      style={{
        backgroundImage: `url(${rvcLogoPath})`,
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '400px 400px',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Subtle overlay to make background more transparent */}
      <div className="absolute inset-0 bg-white bg-opacity-92 pointer-events-none"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-conference-navy bg-opacity-95 shadow-sm backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-white">RVC Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <div className="text-white text-sm">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>{user?.name}</span>
                    {user?.isSuperAdmin && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-conference-gold">
                    {user?.role} • {user?.school?.name || 'Conference Staff'}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-conference-gold border-conference-gold hover:bg-conference-gold hover:text-conference-navy"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user?.isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="school">My School</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            {user?.isSuperAdmin && (
              <TabsTrigger value="users">User Management</TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab - Calendar View */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Games Calendar</h2>
              <Badge variant="outline" className="text-conference-navy">
                {games?.length || 0} Total Games
              </Badge>
            </div>

            {/* Standings Management Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Conference Standings</CardTitle>
                    <CardDescription>Update standings from completed games</CardDescription>
                  </div>
                  <Button 
                    onClick={() => recalculateStandingsMutation.mutate()}
                    disabled={recalculateStandingsMutation.isPending}
                    className="bg-conference-navy hover:bg-conference-gold text-white"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${recalculateStandingsMutation.isPending ? 'animate-spin' : ''}`} />
                    {recalculateStandingsMutation.isPending ? 'Recalculating...' : 'Recalculate Standings'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Recalculate conference standings based on all completed games. This will update wins, losses, 
                  and percentages for all teams across all sports.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <Badge variant="outline" className="text-gray-600">
                    <Trophy className="h-3 w-3 mr-1" />
                    Auto-updates after each game result
                  </Badge>
                  <Badge variant="outline" className="text-gray-600">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Manual recalculation available
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Calendar and Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Games Calendar</CardTitle>
                    <CardDescription>Navigate to past and future games by selecting dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      className="rounded-md border"
                      modifiers={{
                        hasGame: getGameDates(),
                        today: new Date()
                      }}
                      modifiersStyles={{
                        hasGame: {
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          borderRadius: '50%'
                        },
                        today: {
                          fontWeight: 'bold',
                          textDecoration: 'underline'
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Section */}
              <div className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="school-filter" className="text-sm font-medium">School</Label>
                      <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Schools" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Schools</SelectItem>
                          {schools?.map((school) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sport-filter" className="text-sm font-medium">Sport</Label>
                      <Select value={selectedSportFilter} onValueChange={setSelectedSportFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Sports" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sports</SelectItem>
                          {sports?.map((sport) => (
                            <SelectItem key={sport.id} value={sport.id.toString()}>
                              {sport.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Date Games */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isToday(selectedDate) ? "Today's Games" : `Games on ${format(selectedDate, 'MMM dd, yyyy')}`}
                    </CardTitle>
                    <CardDescription>Click on any game to record results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getFilteredGamesForDate(selectedDate).length === 0 ? (
                        <p className="text-gray-500 text-center py-4 text-sm">
                          {isToday(selectedDate) 
                            ? "No games scheduled for today" 
                            : "No games on this date"
                          }
                        </p>
                      ) : (
                        getFilteredGamesForDate(selectedDate).map((game) => {
                          const homeSchool = schools?.find(s => s.id === game.homeTeamId);
                          const awaySchool = schools?.find(s => s.id === game.awayTeamId);
                          const sport = sports?.find(s => s.id === game.sportId);
                          
                          return (
                            <Card key={game.id} className="cursor-pointer hover:bg-gray-50 transition-colors border"
                                  onClick={() => {
                                    setSelectedGame(game);
                                    setIsGameResultDialogOpen(true);
                                    gameResultForm.setValue("gameId", game.id);
                                  }}
                                  data-testid={`game-card-${game.id}`}>
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">{game.gameTime}</div>
                                    <Badge variant="secondary" className="text-xs">{sport?.name}</Badge>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm">
                                      <div className="font-medium">{awaySchool?.name}</div>
                                      <div className="text-xs text-gray-500">@ {homeSchool?.name}</div>
                                    </div>
                                    
                                    {game.isCompleted ? (
                                      <div className="flex items-center space-x-1">
                                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                          {game.homeScore} - {game.awayScore}
                                        </Badge>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <Badge variant="outline" className="text-xs">Pending</Badge>
                                        <Clock className="h-4 w-4 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>


          {/* School Editor Tab */}
          <TabsContent value="school" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My School Information</h2>
              <Badge variant="outline" className="text-conference-navy">
                Athletic Director Access
              </Badge>
            </div>
            <SchoolEditor />
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
              <div className="flex gap-2">
                <Button onClick={() => setIsNewsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Article
                </Button>
                <Button onClick={() => setIsPdfDialogOpen(true)} variant="outline">
                  <FileIcon className="h-4 w-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Published Articles</CardTitle>
                <CardDescription>Manage conference news and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {news?.slice(0, 10).map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{article.excerpt}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">{article.category}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(article.publishDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {article.imageUrl && <ImageIcon className="h-4 w-4 text-blue-600" />}
                        {article.pdfUrl && <FileIcon className="h-4 w-4 text-red-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Super Admin User Management Tab */}
          {user?.isSuperAdmin && (
            <TabsContent value="users" className="space-y-6">
              <SuperAdminPanel />
            </TabsContent>
          )}

        </Tabs>
        </div>

        {/* Game Result Recording Dialog */}
        <Dialog open={isGameResultDialogOpen} onOpenChange={setIsGameResultDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enter Game Result</DialogTitle>
              {selectedGame && (
                <p className="text-sm text-gray-600">
                  Record the final score and details for this game
                </p>
              )}
            </DialogHeader>
            
            {selectedGame && (
              <Form {...gameResultForm}>
                <form onSubmit={gameResultForm.handleSubmit(onSubmitGameResult)} className="space-y-4">
                  {/* Score Entry */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={gameResultForm.control}
                      name="homeScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Team Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={gameResultForm.control}
                      name="awayScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Away Team Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsGameResultDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-conference-navy hover:bg-blue-800"
                    >
                      Save Result
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* News Management Dialogs */}
        <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add News Article</DialogTitle>
            </DialogHeader>
            <Form {...newsForm}>
              <form onSubmit={newsForm.handleSubmit(onSubmitNews)} className="space-y-4">
                <FormField
                  control={newsForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Article title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newsForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Article content" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Article</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* PDF Upload Dialog */}
        <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload PDF Article</DialogTitle>
            </DialogHeader>
            <Form {...pdfForm}>
              <form onSubmit={pdfForm.handleSubmit(onSubmitPdfArticle)} className="space-y-4">
                <FormField
                  control={pdfForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article Title</FormLabel>
                      <FormControl>
                        <Input placeholder="PDF article title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPdfDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Upload PDF</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
