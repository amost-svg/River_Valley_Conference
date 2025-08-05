import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  User as UserIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { School, Sport, Game, News, GameResultSubmission, User, NewsUpdated } from "@shared/schema";
import { insertGameSchema, insertNewsSchema, insertNewsUpdatedSchema } from "@shared/schema";
import GlobalCalendar from "@/components/GlobalCalendar";
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
      homeScore: null,
      awayScore: null,
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
      return apiRequest("/api/auth/logout", {
        method: "POST",
      });
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

  // Filtered games for Results tab
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
          <TabsList className={`grid w-full ${user?.isSuperAdmin ? 'grid-cols-8' : 'grid-cols-7'}`}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="school">My School</TabsTrigger>
            <TabsTrigger value="upload">Calendar Instructions</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="calendar">Calendars</TabsTrigger>
            {user?.isSuperAdmin && (
              <TabsTrigger value="users">User Management</TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab - Global Calendar */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-conference-navy" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Schools</p>
                      <p className="text-2xl font-bold text-gray-900">{schools?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-conference-gold" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Sports</p>
                      <p className="text-2xl font-bold text-gray-900">{sports?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-conference-green" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Games</p>
                      <p className="text-2xl font-bold text-gray-900">{games?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">News Articles</p>
                      <p className="text-2xl font-bold text-gray-900">{news?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Global RVC Calendar */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Conference-wide Events</h2>
              <GlobalCalendar />
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

          {/* Schedule Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Upload Athletic Schedule</h2>
              <Badge variant="outline" className="text-blue-600">
                Conference & Non-Conference Games
              </Badge>
            </div>
            <ScheduleUploader />
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Games Management</h2>
              <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-conference-navy hover:bg-blue-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Game</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...gameForm}>
                    <form onSubmit={gameForm.handleSubmit(onSubmitGame)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={gameForm.control}
                          name="homeTeamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Home Team</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select home team" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {schools?.map((school) => (
                                    <SelectItem key={school.id} value={school.id.toString()}>
                                      {school.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={gameForm.control}
                          name="awayTeamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Away Team</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select away team" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {schools?.map((school) => (
                                    <SelectItem key={school.id} value={school.id.toString()}>
                                      {school.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={gameForm.control}
                        name="sportId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sport</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sport" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sports?.map((sport) => (
                                  <SelectItem key={sport.id} value={sport.id.toString()}>
                                    {sport.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={gameForm.control}
                          name="gameDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Game Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={gameForm.control}
                          name="gameTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Game Time</FormLabel>
                              <FormControl>
                                <Input placeholder="7:00 PM" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>



                      <Button 
                        type="submit" 
                        className="w-full bg-conference-navy hover:bg-blue-800"
                        disabled={createGameMutation.isPending}
                      >
                        {createGameMutation.isPending ? "Creating..." : "Create Game"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                <div className="space-y-4">
                  {games && games.length > 0 ? (
                    games.map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Game #{game.id}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(game.gameDate)} • {game.gameTime}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={game.isCompleted ? "default" : "secondary"}>
                            {game.isCompleted ? "Complete" : "Scheduled"}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No games scheduled</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">News Management</h2>
              <div className="flex space-x-2">
                <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-conference-navy hover:bg-blue-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create News Article with Media</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...enhancedNewsForm}>
                      <form onSubmit={enhancedNewsForm.handleSubmit(onSubmitEnhancedNews)} className="space-y-4">
                        <FormField
                          control={enhancedNewsForm.control}
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
                          control={enhancedNewsForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="General">General</SelectItem>
                                  <SelectItem value="Sports">Sports</SelectItem>
                                  <SelectItem value="Announcement">Announcement</SelectItem>
                                  <SelectItem value="Event">Event</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={enhancedNewsForm.control}
                          name="excerpt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Excerpt</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Brief summary..." {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                          <Label>Article Image</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            {imagePreview ? (
                              <div className="relative">
                                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={clearImage}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => imageInputRef.current?.click()}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Image
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                              </div>
                            )}
                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <FormField
                          control={enhancedNewsForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Full article content..." {...field} rows={8} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full bg-conference-navy hover:bg-blue-800"
                          disabled={createEnhancedNewsMutation.isPending}
                        >
                          {createEnhancedNewsMutation.isPending ? "Publishing..." : "Publish Article"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-conference-navy text-conference-navy hover:bg-conference-navy hover:text-white">
                      <FileIcon className="h-4 w-4 mr-2" />
                      Upload PDF
                    </Button>
                  </DialogTrigger>
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
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="PDF article title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={pdfForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="General">General</SelectItem>
                                  <SelectItem value="Sports">Sports</SelectItem>
                                  <SelectItem value="Announcement">Announcement</SelectItem>
                                  <SelectItem value="Document">Document</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={pdfForm.control}
                          name="excerpt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Brief description of the PDF content..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* PDF Upload Section */}
                        <div className="space-y-2">
                          <Label>PDF File</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            {selectedPdf ? (
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center">
                                  <FileIcon className="h-6 w-6 text-red-500 mr-2" />
                                  <span className="text-sm font-medium">{selectedPdf.name}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearPdf}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center">
                                <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => pdfInputRef.current?.click()}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload PDF
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">PDF files up to 10MB</p>
                              </div>
                            )}
                            <input
                              ref={pdfInputRef}
                              type="file"
                              accept=".pdf"
                              onChange={handlePdfSelect}
                              className="hidden"
                            />
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-conference-navy hover:bg-blue-800"
                          disabled={createPdfArticleMutation.isPending || !selectedPdf}
                        >
                          {createPdfArticleMutation.isPending ? "Uploading..." : "Upload PDF Article"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* News Articles Display */}
            <Card>
              <CardHeader>
                <CardTitle>Published Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enhancedNews && enhancedNews.length > 0 ? (
                    enhancedNews.map((article) => (
                      <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{article.title}</h3>
                            {article.pdfUrl && (
                              <Badge variant="secondary" className="text-xs">
                                <FileIcon className="h-3 w-3 mr-1" />
                                PDF
                              </Badge>
                            )}
                            {article.imageUrl && (
                              <Badge variant="secondary" className="text-xs">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Image
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{article.excerpt}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <Badge variant="outline">{article.category}</Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(article.publishDate)}
                            </span>
                            <span className="text-xs text-gray-500">
                              by {article.author.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {article.pdfUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(article.pdfUrl || '', '_blank')}
                            >
                              <FileIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No enhanced articles published yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legacy News Articles */}
            {news && news.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Legacy Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {news.map((article) => (
                      <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <h3 className="font-medium">{article.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{article.excerpt}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <Badge variant="outline">{article.category}</Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(article.publishDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Game Results Management</h2>
              <div className="flex items-center space-x-4">
                <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by school" />
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
                <Select value={selectedSportFilter} onValueChange={setSelectedSportFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by sport" />
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
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames && filteredGames.length > 0 ? (
                filteredGames.map((game) => {
                  const homeTeamName = game.homeTeam?.name || game.homeTeamName || "TBD";
                  const awayTeamName = game.awayTeam?.name || game.awayTeamName || "TBD";
                  const isCompleted = game.isCompleted;
                  
                  return (
                    <Card 
                      key={game.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-conference-navy'
                      }`}
                      onClick={() => openGameResultDialog(game)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={isCompleted ? "default" : "secondary"}>
                            {isCompleted ? "Final" : "Scheduled"}
                          </Badge>
                          <span className="text-xs text-gray-500">{game.sport?.name}</span>
                        </div>
                        <CardTitle className="text-lg">{homeTeamName} vs {awayTeamName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {formatDate(game.gameDate)} • {game.gameTime}
                            </span>
                            {game.level && (
                              <Badge variant="outline" className="text-xs">
                                {game.level}
                              </Badge>
                            )}
                          </div>
                          
                          {isCompleted && game.homeScore !== null && game.awayScore !== null ? (
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="flex items-center justify-between text-lg font-semibold">
                                <span className={game.homeScore > game.awayScore ? "text-green-600" : ""}>
                                  {homeTeamName}: {game.homeScore}
                                </span>
                                <span className={game.awayScore > game.homeScore ? "text-green-600" : ""}>
                                  {awayTeamName}: {game.awayScore}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-2">
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Enter Result
                              </Button>
                            </div>
                          )}
                          
                          {game.location && (
                            <p className="text-xs text-gray-500">@ {game.location}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No games found for the selected filters</p>
                </div>
              )}
            </div>

            {/* Game Result Entry Dialog */}
            <Dialog open={isGameResultDialogOpen} onOpenChange={setIsGameResultDialogOpen}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enter Game Result</DialogTitle>
                  {selectedGame && (
                    <p className="text-sm text-gray-600">
                      {selectedGame.homeTeam?.name || selectedGame.homeTeamName} vs {selectedGame.awayTeam?.name || selectedGame.awayTeamName} • {formatDate(selectedGame.gameDate)}
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
                              <FormLabel>{selectedGame.homeTeam?.name || selectedGame.homeTeamName} Score</FormLabel>
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
                              <FormLabel>{selectedGame.awayTeam?.name || selectedGame.awayTeamName} Score</FormLabel>
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

                      {/* Game Summary */}
                      <FormField
                        control={gameResultForm.control}
                        name="gameSummary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Game Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief summary of the game..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Key Players */}
                      <FormField
                        control={gameResultForm.control}
                        name="keyPlayers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Players</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Notable performances and key contributors..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Game Highlights */}
                      <FormField
                        control={gameResultForm.control}
                        name="gameHighlights"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Game Highlights</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Key moments and highlights from the game..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Records */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={gameResultForm.control}
                          name="recordAfterGame"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Record After Game</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 5-2"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={gameResultForm.control}
                          name="conferenceRecord"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conference Record</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 3-1"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Next Game Info */}
                      <FormField
                        control={gameResultForm.control}
                        name="nextGameInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Game Information</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Information about the next scheduled game..."
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                          disabled={submitGameResultMutation.isPending}
                        >
                          {submitGameResultMutation.isPending ? "Saving..." : "Save Result"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Calendar Integration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Calendars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      'RVC Volleyball',
                      'RVC Soccer', 
                      'RVC Girls Basketball',
                      'RVC Boys Basketball',
                      'RVC Baseball',
                      'RVC Softball',
                      'RVC Track',
                      'RVC Scholastic Bowl'
                    ].map((calendar) => (
                      <div key={calendar} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-conference-navy mr-3" />
                          <span className="font-medium">{calendar}</span>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Sync</span>
                      <span className="font-medium">Just now</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Events Synced</span>
                      <span className="font-medium">156 events</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Upcoming Events</h4>
                      <p className="text-sm text-gray-600">Next 7 days: 12 games</p>
                      <p className="text-sm text-gray-600">Next 30 days: 45 games</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Super Admin User Management Tab */}
          {user?.isSuperAdmin && (
            <TabsContent value="users" className="space-y-6">
              <SuperAdminPanel />
            </TabsContent>
          )}

        </Tabs>
        </div>
      </div>
    </div>
  );
}
