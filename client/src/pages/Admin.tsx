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
import { formatConferenceDate, isSameConferenceDay, formatDateForDisplay } from "@shared/dateUtils";
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
  homeScore: z.coerce.number().min(0, "Score must be 0 or greater"),
  awayScore: z.coerce.number().min(0, "Score must be 0 or greater"),
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

// Add Game Submission schema (for pending game submissions)
const addGameSubmissionSchema = z.object({
  sportId: z.number().min(1, "Please select a sport"),
  level: z.string().min(1, "Please select a level"),
  isConference: z.boolean(),
  gameDate: z.string().min(1, "Please select a date"),
  gameTime: z.string().min(1, "Please enter a time"),
  homeTeamId: z.number().min(1, "Please select a home team"),
  awayTeamId: z.number().min(1, "Please select an away team"),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  externalLink: z.string().url().optional().or(z.literal("")),
});

type GameFormData = z.infer<typeof gameSchema>;
type NewsFormData = z.infer<typeof newsSchema>;
type EnhancedNewsFormData = z.infer<typeof enhancedNewsSchema>;
type GameResultFormData = z.infer<typeof gameResultSchema>;
type PdfArticleFormData = z.infer<typeof pdfArticleSchema>;
type AddGameSubmissionFormData = z.infer<typeof addGameSubmissionSchema>;

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
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalDialogDate, setApprovalDialogDate] = useState<Date | null>(null);
  const [isAddGameSubmissionDialogOpen, setIsAddGameSubmissionDialogOpen] = useState(false);
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
  const { data: pendingSubmissionsByDate } = useQuery<{ [date: string]: number }>({ 
    queryKey: ["/api/admin/pending-submissions-by-date"] 
  });
  
  // Helper function to format date consistently without timezone conversion
  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Query for submissions on a specific date for approval dialog
  const { data: dateSubmissions } = useQuery<(GameResultSubmission & { game: Game & { homeTeam: School; awayTeam: School; sport: Sport } })[]>({
    queryKey: ["/api/admin/game-result-submissions/date", approvalDialogDate ? formatDateForAPI(approvalDialogDate) : null],
    enabled: !!approvalDialogDate,
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
    mutationFn: async ({ id, action, notes }: { id: number; action: 'approve' | 'reject'; notes?: string }) => {
      return apiRequest("POST", `/api/admin/game-result-submissions/${id}/moderate`, {
        action,
        notes,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Submission moderated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-submissions-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions/date", approvalDialogDate ? formatDateForAPI(approvalDialogDate) : null] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to moderate submission", variant: "destructive" });
    },
  });

  // Approve submission mutation
  const approveSubmissionMutation = useMutation({
    mutationFn: async ({ id, rejectOthers = false }: { id: number; rejectOthers?: boolean }) => {
      const submission = dateSubmissions?.find(s => s.id === id);
      if (!submission) throw new Error("Submission not found");
      
      // Approve this submission
      await apiRequest("POST", `/api/admin/game-result-submissions/${id}/moderate`, {
        action: "approve",
        notes: "Approved",
      });
      
      // If rejectOthers is true, reject other submissions for the same game
      if (rejectOthers) {
        const otherSubmissions = dateSubmissions?.filter(s => 
          s.gameId === submission.gameId && s.id !== id && !s.isModerated
        ) || [];
        
        for (const otherSub of otherSubmissions) {
          await apiRequest("POST", `/api/admin/game-result-submissions/${otherSub.id}/moderate`, {
            action: "reject",
            notes: "Rejected - Another submission approved for this game",
          });
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Submission approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-submissions-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions/date", approvalDialogDate ? formatDateForAPI(approvalDialogDate) : null] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve submission", variant: "destructive" });
    },
  });

  // Reject submission mutation
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      return apiRequest("POST", `/api/admin/game-result-submissions/${id}/moderate`, {
        action: "reject",
        notes: reason || "Rejected",
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Submission rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-submissions-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-result-submissions/date", approvalDialogDate ? formatDateForAPI(approvalDialogDate) : null] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject submission", variant: "destructive" });
    },
  });

  // Standings recalculation mutation
  const recalculateStandingsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/recalculate-standings", {});
    },
    onSuccess: (data: any) => {
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

  // Helper function to get games for a specific date (timezone-aware)
  const getGamesForDate = (date: Date) => {
    if (!games) return [];
    return games.filter((game) => {
      return isSameConferenceDay(game.gameDate, date);
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

  // Get dates that have pending submissions for badge highlighting
  const getPendingSubmissionDates = () => {
    if (!pendingSubmissionsByDate) return [];
    return Object.keys(pendingSubmissionsByDate).map(dateString => new Date(dateString));
  };

  // Get count of pending submissions for a specific date
  const getPendingSubmissionCount = (date: Date) => {
    if (!pendingSubmissionsByDate) return 0;
    const dateString = formatDateForAPI(date); // YYYY-MM-DD format
    return pendingSubmissionsByDate[dateString] || 0;
  };

  // Handle clicking on calendar dates with pending submissions
  const handleCalendarDateClick = (date: Date) => {
    const pendingCount = getPendingSubmissionCount(date);
    if (pendingCount > 0) {
      setApprovalDialogDate(date);
      setIsApprovalDialogOpen(true);
    } else {
      setSelectedDate(date);
    }
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

  const moderateSubmission = (id: number, action: "approve" | "reject", notes?: string) => {
    moderateSubmissionMutation.mutate({ id, action, notes });
  };

  const formatDate = (date: string | Date) => {
    return formatDateForDisplay(date);
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="text-white border-white hover:bg-white hover:text-conference-navy"
                  data-testid="button-back-to-homepage"
                >
                  Back to Homepage
                </Button>
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
                    {user?.role} • {user?.schoolId ? schools?.find(s => s.id === user.schoolId)?.name : 'Conference Staff'}
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
          <TabsList className={`grid w-full ${user?.isSuperAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="standings">Conference Standings</TabsTrigger>
            <TabsTrigger value="school">My School</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            {user?.isSuperAdmin && (
              <TabsTrigger value="users">User Management</TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard Tab - Calendar View */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">River Valley Conference — Games Calendar</h2>
                <p className="text-gray-600 mt-1">View and manage scheduled games</p>
              </div>
              <div className="flex items-center gap-3">
                {user?.isSuperAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      apiRequest("POST", "/api/admin/sync-games-json", {})
                        .then((data: any) => {
                          toast({
                            title: "Games Synced",
                            description: `${data.gamesCount} games synced successfully for fast loading.`
                          });
                        })
                        .catch(() => {
                          toast({
                            title: "Sync Failed",
                            description: "Failed to sync games data.",
                            variant: "destructive"
                          });
                        });
                    }}
                    className="text-conference-navy border-conference-navy hover:bg-conference-navy hover:text-white"
                    data-testid="button-sync-games"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Games
                  </Button>
                )}
                <Badge variant="outline" className="text-conference-navy">
                  {games?.length || 0} Total Games
                </Badge>
              </div>
            </div>

            {/* Calendar and Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Games Calendar</CardTitle>
                        <CardDescription>Navigate to past and future games by selecting dates</CardDescription>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setIsAddGameSubmissionDialogOpen(true)}
                        className="bg-conference-gold hover:bg-conference-navy text-conference-navy hover:text-white"
                        data-testid="button-add-game"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add a Game
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && handleCalendarDateClick(date)}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      className="rounded-md border"
                      modifiers={{
                        hasGame: getGameDates(),
                        hasPendingSubmissions: getPendingSubmissionDates(),
                        today: new Date()
                      }}
                      modifiersStyles={{
                        hasGame: {
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          borderRadius: '50%'
                        },
                        hasPendingSubmissions: {
                          position: 'relative'
                        },
                        today: {
                          fontWeight: 'bold',
                          textDecoration: 'underline'
                        }
                      }}
                      components={{
                        DayContent: ({ date, ...props }) => {
                          const pendingCount = getPendingSubmissionCount(date);
                          return (
                            <div 
                              className={`relative w-full h-full flex items-center justify-center ${
                                pendingCount > 0 ? 'cursor-pointer hover:bg-orange-100' : ''
                              }`} 
                              data-testid={`calendar-day-${formatDateForAPI(date)}`}
                              title={pendingCount > 0 ? `Click to review ${pendingCount} pending submission${pendingCount > 1 ? 's' : ''}` : ''}
                            >
                              <span>{date.getDate()}</span>
                              {pendingCount > 0 && (
                                <span 
                                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg hover:bg-red-600 transition-colors"
                                  style={{ fontSize: '10px', minWidth: '18px', minHeight: '18px' }}
                                  data-testid={`calendar-badge-${formatDateForAPI(date)}`}
                                  title={`${pendingCount} pending submission${pendingCount > 1 ? 's' : ''}`}
                                >
                                  {pendingCount}
                                </span>
                              )}
                            </div>
                          );
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

            {/* Mini Conference Standings */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quick Standings (Top 5)</CardTitle>
                    <CardDescription>Conference standings snapshot</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => recalculateStandingsMutation.mutate()}
                      disabled={recalculateStandingsMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="text-conference-navy border-conference-navy hover:bg-conference-navy hover:text-white"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${recalculateStandingsMutation.isPending ? 'animate-spin' : ''}`} />
                      Recalculate Standings
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("standings")}
                      size="sm"
                      className="bg-conference-navy hover:bg-conference-gold text-white"
                      data-testid="button-view-full-standings"
                    >
                      View full standings →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  View complete standings with sortable tables in the Conference Standings tab. Auto-updates from approved game results.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conference Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Conference Standings</h2>
                <p className="text-gray-600 mt-1">Sortable standings tables by sport</p>
              </div>
              <Button 
                onClick={() => recalculateStandingsMutation.mutate()}
                disabled={recalculateStandingsMutation.isPending}
                className="bg-conference-navy hover:bg-conference-gold text-white"
                data-testid="button-recalculate-standings"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${recalculateStandingsMutation.isPending ? 'animate-spin' : ''}`} />
                {recalculateStandingsMutation.isPending ? 'Recalculating...' : 'Recalculate Standings'}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Standings Management</CardTitle>
                <CardDescription>
                  View and manage conference standings. Click "Recalculate Standings" to update from all approved game results.
                  Admin override available per team (coming soon).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-12">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Conference Standings View</p>
                  <p className="text-sm">Full sortable standings tables will be displayed here.</p>
                  <p className="text-sm mt-2">Features coming: Sort by any column, admin override per school, streak tracking</p>
                </div>
              </CardContent>
            </Card>
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
                              data-testid="input-home-score"
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
                              data-testid="input-away-score"
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

        {/* Approval Dialog for Pending Submissions */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Review Pending Submissions - {approvalDialogDate && format(approvalDialogDate, 'MMMM dd, yyyy')}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Review and approve or reject game result submissions for this date
              </p>
            </DialogHeader>
            
            {dateSubmissions?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending submissions for this date</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group submissions by game */}
                {Object.entries(
                  dateSubmissions?.reduce((groups, submission) => {
                    const gameKey = submission.gameId;
                    if (!groups[gameKey]) {
                      groups[gameKey] = [];
                    }
                    groups[gameKey].push(submission);
                    return groups;
                  }, {} as Record<number, typeof dateSubmissions>) || {}
                ).map(([gameId, gameSubmissions]) => {
                  const game = gameSubmissions[0]?.game;
                  if (!game) return null;
                  
                  const hasConflicts = gameSubmissions.length > 1;
                  const scoreConflicts = hasConflicts && 
                    gameSubmissions.some(s => 
                      s.homeScore !== gameSubmissions[0].homeScore || 
                      s.awayScore !== gameSubmissions[0].awayScore
                    );

                  return (
                    <Card key={gameId} className={`${hasConflicts ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {game.awayTeam?.name || game.awayTeamName} @ {game.homeTeam?.name || game.homeTeamName}
                            </CardTitle>
                            <CardDescription>
                              {game.sport?.name} • {game.gameTime} • {formatDate(game.gameDate)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hasConflicts && (
                              <Badge variant="destructive" className="text-xs">
                                {gameSubmissions.length} Submissions
                              </Badge>
                            )}
                            {scoreConflicts && (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                Score Conflicts
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {hasConflicts && (
                          <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mt-2">
                            <div className="flex items-center space-x-2 mb-2">
                              <XCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">
                                Multiple submissions detected
                              </span>
                            </div>
                            <p className="text-xs text-orange-700">
                              Review each submission carefully. You can approve one and automatically reject the others.
                            </p>
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {gameSubmissions
                          .filter(submission => !submission.isModerated)
                          .sort((a, b) => {
                            const dateA = a.submissionDate ? new Date(a.submissionDate).getTime() : 0;
                            const dateB = b.submissionDate ? new Date(b.submissionDate).getTime() : 0;
                            return dateA - dateB;
                          })
                          .map((submission, index) => (
                          <div 
                            key={submission.id} 
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                            data-testid={`submission-${submission.id}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-4">
                                  <Badge variant="outline" className="text-xs">
                                    Submission #{index + 1}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {submission.submissionDate ? new Date(submission.submissionDate).toLocaleString() : 'Unknown date'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-gray-600">Submitted Score</Label>
                                    <div className="font-medium text-lg">
                                      <span className="text-blue-600">{game.homeTeam?.name || game.homeTeamName}: {submission.homeScore}</span>
                                      <span className="mx-2">-</span>
                                      <span className="text-red-600">{game.awayTeam?.name || game.awayTeamName}: {submission.awayScore}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600">Submitter</Label>
                                    <div className="text-sm">
                                      <div className="font-medium">{submission.submitterName}</div>
                                      <div className="text-gray-500 text-xs">{submission.submitterEmail}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {scoreConflicts && gameSubmissions.length > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {gameSubmissions.filter(s => 
                                      s.homeScore === submission.homeScore && 
                                      s.awayScore === submission.awayScore && 
                                      !s.isModerated
                                    ).length} with this score
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => rejectSubmissionMutation.mutate({ 
                                    id: submission.id, 
                                    reason: "Rejected by Athletic Director" 
                                  })}
                                  disabled={rejectSubmissionMutation.isPending}
                                  data-testid={`button-reject-${submission.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                
                                {hasConflicts ? (
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => approveSubmissionMutation.mutate({ 
                                        id: submission.id, 
                                        rejectOthers: false 
                                      })}
                                      disabled={approveSubmissionMutation.isPending}
                                      data-testid={`button-approve-${submission.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve Only
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() => approveSubmissionMutation.mutate({ 
                                        id: submission.id, 
                                        rejectOthers: true 
                                      })}
                                      disabled={approveSubmissionMutation.isPending}
                                      data-testid={`button-approve-reject-others-${submission.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve & Reject Others
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => approveSubmissionMutation.mutate({ 
                                      id: submission.id, 
                                      rejectOthers: false 
                                    })}
                                    disabled={approveSubmissionMutation.isPending}
                                    data-testid={`button-approve-${submission.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Batch actions for conflicts */}
                        {hasConflicts && gameSubmissions.filter(s => !s.isModerated).length > 1 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Batch Actions</Label>
                                <p className="text-xs text-gray-600">
                                  Quick actions for all submissions for this game
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => {
                                    const unmoderatedSubmissions = gameSubmissions.filter(s => !s.isModerated);
                                    unmoderatedSubmissions.forEach(submission => {
                                      rejectSubmissionMutation.mutate({ 
                                        id: submission.id, 
                                        reason: "Rejected - No suitable submission found" 
                                      });
                                    });
                                  }}
                                  disabled={rejectSubmissionMutation.isPending}
                                  data-testid={`button-reject-all-${gameId}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject All
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsApprovalDialogOpen(false)}
                data-testid="button-close-approval-dialog"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
