import { useState } from "react";
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
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { School, Sport, Game, News, GameResultSubmission, User } from "@shared/schema";
import { insertGameSchema, insertNewsSchema } from "@shared/schema";
import GlobalCalendar from "@/components/GlobalCalendar";
import SchoolEditor from "@/components/SchoolEditor";
import ScheduleUploader from "@/components/ScheduleUploader";

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

type GameFormData = z.infer<typeof gameSchema>;
type NewsFormData = z.infer<typeof newsSchema>;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Data queries
  const { data: schools } = useQuery<School[]>({ queryKey: ["/api/schools"] });
  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: games } = useQuery<Game[]>({ queryKey: ["/api/games"] });
  const { data: news } = useQuery<News[]>({ queryKey: ["/api/news"] });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-conference-navy shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">RVC Admin Dashboard</h1>
            <Button variant="outline" className="text-conference-gold border-conference-gold hover:bg-conference-gold hover:text-conference-navy">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="school">My School</TabsTrigger>
            <TabsTrigger value="upload">Upload Schedule</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="calendar">Calendars</TabsTrigger>
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
              <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-conference-navy hover:bg-blue-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create News Article</DialogTitle>
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

                      <FormField
                        control={newsForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Full article content..." {...field} rows={6} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={newsForm.control}
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
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="Academic">Academic</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Championship">Championship</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-conference-navy hover:bg-blue-800"
                        disabled={createNewsMutation.isPending}
                      >
                        {createNewsMutation.isPending ? "Publishing..." : "Publish Article"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent>
                <div className="space-y-4">
                  {news && news.length > 0 ? (
                    news.map((article) => (
                      <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg">
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
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No news articles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Game Result Submissions</h2>
              <Badge variant="outline" className="text-sm">
                {submissions?.filter(s => !s.isModerated).length || 0} Pending Review
              </Badge>
            </div>

            <Card>
              <CardContent>
                <div className="space-y-4">
                  {submissions && submissions.length > 0 ? (
                    submissions.map((submission) => (
                      <div key={submission.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium">Game Result Submission</h3>
                              <Badge variant={submission.isModerated ? "default" : "secondary"}>
                                {submission.isModerated ? "Reviewed" : "Pending"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Submitted by:</strong> {submission.submitterName} ({submission.submitterEmail})</p>
                              <p><strong>Date:</strong> {submission.submissionDate ? formatDate(submission.submissionDate) : 'Unknown'}</p>
                              <p><strong>Score:</strong> Home {submission.homeScore} - Away {submission.awayScore}</p>
                              {submission.moderationNotes && (
                                <p><strong>Notes:</strong> {submission.moderationNotes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!submission.isModerated && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => moderateSubmission(submission.id, "Approved")}
                                  disabled={moderateSubmissionMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => moderateSubmission(submission.id, "Rejected")}
                                  disabled={moderateSubmissionMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No submissions to review</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Google Calendar Integration</h2>
              <Button className="bg-conference-navy hover:bg-blue-800">
                <Upload className="h-4 w-4 mr-2" />
                Sync Calendars
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Sport Calendars</CardTitle>
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
                    ].map((calendar, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
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
        </Tabs>
      </div>
    </div>
  );
}