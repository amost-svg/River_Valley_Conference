import { 
  schools, sports, games, standings, news, contacts, users, newsUpdated, 
  gameResultSubmissions, conferenceOfficials,
  type School, type Sport, type Game, type Standing, type News, type Contact,
  type User, type NewsUpdated, type GameResultSubmission, type ConferenceOfficial,
  type InsertSchool, type InsertSport, type InsertGame, type InsertStanding, 
  type InsertNews, type InsertContact, type InsertUser, type InsertNewsUpdated,
  type InsertGameResultSubmission, type InsertConferenceOfficial, type GameResult
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Schools
  getSchools(): Promise<School[]>;
  getSchool(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined>;
  deleteSchool(id: number): Promise<boolean>;

  // Sports
  getSports(): Promise<Sport[]>;
  getSport(id: number): Promise<Sport | undefined>;
  createSport(sport: InsertSport): Promise<Sport>;

  // Games
  getGames(): Promise<(Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport })[]>;
  getGamesBySport(sportId: number): Promise<(Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport })[]>;
  getGamesBySchool(schoolId: number): Promise<(Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport })[]>;
  getUpcomingGames(): Promise<(Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport })[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  updateGameResult(gameResult: GameResult, userId: number): Promise<Game | undefined>;

  // Standings
  getStandings(): Promise<(Standing & { school: School; sport: Sport })[]>;
  getStandingsBySport(sportId: number): Promise<(Standing & { school: School; sport: Sport })[]>;
  createStanding(standing: InsertStanding): Promise<Standing>;
  updateStanding(id: number, standing: Partial<InsertStanding>): Promise<Standing | undefined>;
  updateStandingsFromGame(game: Game): Promise<void>;

  // News
  getNews(): Promise<News[]>;
  getNewsById(id: number): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;

  // Users (Authentication)
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // News Updated (with author support)
  getNewsUpdated(): Promise<(NewsUpdated & { author: User })[]>;
  getNewsUpdatedById(id: number): Promise<(NewsUpdated & { author: User }) | undefined>;
  createNewsUpdated(news: InsertNewsUpdated): Promise<NewsUpdated>;
  updateNewsUpdated(id: number, news: Partial<InsertNewsUpdated>): Promise<NewsUpdated | undefined>;

  // Game Result Submissions
  getGameResultSubmissions(): Promise<(GameResultSubmission & { game: Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport } })[]>;
  createGameResultSubmission(submission: InsertGameResultSubmission): Promise<GameResultSubmission>;
  moderateGameResultSubmission(id: number, moderatedBy: number, notes?: string): Promise<GameResultSubmission | undefined>;

  // Conference Officials
  getConferenceOfficials(): Promise<(ConferenceOfficial & { school: School })[]>;
  getActiveConferenceOfficials(): Promise<(ConferenceOfficial & { school: School })[]>;
  createConferenceOfficial(official: InsertConferenceOfficial): Promise<ConferenceOfficial>;
  updateConferenceOfficial(id: number, official: Partial<InsertConferenceOfficial>): Promise<ConferenceOfficial | undefined>;
}

export class MemStorage implements IStorage {
  private schools: Map<number, School> = new Map();
  private sports: Map<number, Sport> = new Map();
  private games: Map<number, Game> = new Map();
  private standings: Map<number, Standing> = new Map();
  private news: Map<number, News> = new Map();
  private contacts: Map<number, Contact> = new Map();
  
  private currentSchoolId = 1;
  private currentSportId = 1;
  private currentGameId = 1;
  private currentStandingId = 1;
  private currentNewsId = 1;
  private currentContactId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize schools - Placeholder data (will be replaced by CSV import)
    const schoolsData = [
      { 
        name: "Beecher High School", 
        mascot: "Bobcats", 
        address: "Beecher, IL", 
        city: "Beecher",
        state: "Illinois",
        phoneNumber: null,
        superintendentName: null,
        principalName: null,
        athleticDirectorName: null,
        website: null,
        athleticWebsite: null,
        ihsaPageLink: null,
        missionStatement: null,
        imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/beecher-min.png",
        liveStreamingUrl: null,
        liveStreamingPlatform: null,
        latitude: null,
        longitude: null
      },
    ];

    schoolsData.forEach(school => {
      const id = this.currentSchoolId++;
      this.schools.set(id, { 
        ...school, 
        id
      });
    });

    // Initialize official RVC sports only
    const sportsData = [
      { name: "Volleyball", season: "fall" },
      { name: "Soccer", season: "fall" },
      { name: "Girls Basketball", season: "winter" },
      { name: "Boys Basketball", season: "winter" },
      { name: "Softball", season: "spring" },
      { name: "Baseball", season: "spring" },
      { name: "Track", season: "spring" },
    ];

    sportsData.forEach(sport => {
      const id = this.currentSportId++;
      this.sports.set(id, { ...sport, id });
    });

    // Initialize sample games with River Valley Conference schools
    const gamesData = [
      { homeTeamId: 1, awayTeamId: 2, sportId: 1, gameDate: new Date("2024-10-15"), gameTime: "7:00 PM", homeScore: 28, awayScore: 14, isCompleted: true },
      { homeTeamId: 3, awayTeamId: 4, sportId: 1, gameDate: new Date("2024-10-22"), gameTime: "7:30 PM", homeScore: 21, awayScore: 17, isCompleted: true },
      { homeTeamId: 5, awayTeamId: 6, sportId: 1, gameDate: new Date("2024-10-29"), gameTime: "7:00 PM", homeScore: null, awayScore: null, isCompleted: false },
      { homeTeamId: 7, awayTeamId: 8, sportId: 1, gameDate: new Date("2024-11-05"), gameTime: "7:30 PM", homeScore: null, awayScore: null, isCompleted: false },
      { homeTeamId: 9, awayTeamId: 10, sportId: 1, gameDate: new Date("2024-11-12"), gameTime: "7:00 PM", homeScore: null, awayScore: null, isCompleted: false },
      { homeTeamId: 1, awayTeamId: 3, sportId: 2, gameDate: new Date("2024-12-03"), gameTime: "7:30 PM", homeScore: 65, awayScore: 58, isCompleted: true },
      { homeTeamId: 2, awayTeamId: 5, sportId: 2, gameDate: new Date("2024-12-10"), gameTime: "7:00 PM", homeScore: 72, awayScore: 64, isCompleted: true },
      { homeTeamId: 4, awayTeamId: 7, sportId: 2, gameDate: new Date("2024-12-17"), gameTime: "7:30 PM", homeScore: null, awayScore: null, isCompleted: false },
    ];

    gamesData.forEach(game => {
      const id = this.currentGameId++;
      this.games.set(id, { 
        ...game, 
        id,
        homeScore: game.homeScore || null,
        awayScore: game.awayScore || null,
        isCompleted: game.isCompleted || false
      });
    });

    // Initialize standings for River Valley Conference schools
    const standingsData = [
      // Football standings
      { schoolId: 1, sportId: 1, wins: 7, losses: 1, season: "2024-2025" }, // Beecher Bobcats
      { schoolId: 3, sportId: 1, wins: 6, losses: 2, season: "2024-2025" }, // Donovan Wildcats
      { schoolId: 5, sportId: 1, wins: 5, losses: 3, season: "2024-2025" }, // Grace Christian Crusaders
      { schoolId: 8, sportId: 1, wins: 4, losses: 4, season: "2024-2025" }, // Momence Redskins
      { schoolId: 2, sportId: 1, wins: 3, losses: 5, season: "2024-2025" }, // Central Comets
      { schoolId: 10, sportId: 1, wins: 2, losses: 6, season: "2024-2025" }, // Tri-Point Chargers
      // Basketball standings
      { schoolId: 2, sportId: 2, wins: 12, losses: 2, season: "2024-2025" }, // Central Comets
      { schoolId: 7, sportId: 2, wins: 10, losses: 4, season: "2024-2025" }, // Illinois Lutheran Chargers
      { schoolId: 1, sportId: 2, wins: 9, losses: 5, season: "2024-2025" }, // Beecher Bobcats
      { schoolId: 4, sportId: 2, wins: 8, losses: 6, season: "2024-2025" }, // Gardner South Wilmington Panthers
      { schoolId: 6, sportId: 2, wins: 7, losses: 7, season: "2024-2025" }, // Grant Park Dragons
      { schoolId: 9, sportId: 2, wins: 5, losses: 9, season: "2024-2025" }, // St. Anne Cardinals
    ];

    standingsData.forEach(standing => {
      const id = this.currentStandingId++;
      this.standings.set(id, { 
        ...standing, 
        id,
        wins: standing.wins || 0,
        losses: standing.losses || 0
      });
    });

    // Initialize news
    const newsData = [
      {
        title: "Conference Championship Results",
        excerpt: "Central Valley Eagles capture their third consecutive football championship with a dominant performance against...",
        content: "The Central Valley Eagles secured their third consecutive football championship with a commanding 28-14 victory over Westfield Academy in front of a packed stadium.",
        category: "Sports",
        publishDate: new Date("2024-10-20"),
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
      },
      {
        title: "Academic All-Conference Team",
        excerpt: "Congratulations to the 47 student-athletes who achieved Academic All-Conference honors this semester...",
        content: "The River Valley Conference proudly announces the Academic All-Conference team for the fall semester, recognizing student-athletes who excel both on the field and in the classroom.",
        category: "Academic",
        publishDate: new Date("2024-10-18"),
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
      },
      {
        title: "Fall Soccer Playoffs Begin",
        excerpt: "The River Valley Conference soccer playoffs kick off this weekend with quarterfinal matchups across both divisions...",
        content: "Soccer playoffs are here! Eight teams from each division will compete for the conference championship title this weekend.",
        category: "Soccer",
        publishDate: new Date("2024-10-15"),
        imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
      },
    ];

    newsData.forEach(article => {
      const id = this.currentNewsId++;
      this.news.set(id, { 
        ...article, 
        id,
        imageUrl: article.imageUrl || null
      });
    });
  }

  // Schools
  async getSchools(): Promise<School[]> {
    return Array.from(this.schools.values());
  }

  async getSchool(id: number): Promise<School | undefined> {
    return this.schools.get(id);
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const id = this.currentSchoolId++;
    const newSchool: School = { 
      ...school, 
      id,
      city: school.city || null,
      state: school.state || null,
      phoneNumber: school.phoneNumber || null,
      superintendentName: school.superintendentName || null,
      principalName: school.principalName || null,
      athleticDirectorName: school.athleticDirectorName || null,
      website: school.website || null,
      athleticWebsite: school.athleticWebsite || null,
      ihsaPageLink: school.ihsaPageLink || null,
      missionStatement: school.missionStatement || null,
      imageUrl: school.imageUrl || null,
      liveStreamingUrl: school.liveStreamingUrl || null,
      liveStreamingPlatform: school.liveStreamingPlatform || null,
      latitude: school.latitude || null,
      longitude: school.longitude || null
    };
    this.schools.set(id, newSchool);
    return newSchool;
  }

  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined> {
    const existingSchool = this.schools.get(id);
    if (!existingSchool) {
      return undefined;
    }
    
    const updatedSchool: School = {
      ...existingSchool,
      ...school,
      id,
      city: school.city !== undefined ? school.city : existingSchool.city,
      state: school.state !== undefined ? school.state : existingSchool.state,
      phoneNumber: school.phoneNumber !== undefined ? school.phoneNumber : existingSchool.phoneNumber,
      superintendentName: school.superintendentName !== undefined ? school.superintendentName : existingSchool.superintendentName,
      principalName: school.principalName !== undefined ? school.principalName : existingSchool.principalName,
      athleticDirectorName: school.athleticDirectorName !== undefined ? school.athleticDirectorName : existingSchool.athleticDirectorName,
      website: school.website !== undefined ? school.website : existingSchool.website,
      athleticWebsite: school.athleticWebsite !== undefined ? school.athleticWebsite : existingSchool.athleticWebsite,
      ihsaPageLink: school.ihsaPageLink !== undefined ? school.ihsaPageLink : existingSchool.ihsaPageLink,
      missionStatement: school.missionStatement !== undefined ? school.missionStatement : existingSchool.missionStatement,
      imageUrl: school.imageUrl !== undefined ? school.imageUrl : existingSchool.imageUrl,
      liveStreamingUrl: school.liveStreamingUrl !== undefined ? school.liveStreamingUrl : existingSchool.liveStreamingUrl,
      liveStreamingPlatform: school.liveStreamingPlatform !== undefined ? school.liveStreamingPlatform : existingSchool.liveStreamingPlatform,
      latitude: school.latitude !== undefined ? school.latitude : existingSchool.latitude,
      longitude: school.longitude !== undefined ? school.longitude : existingSchool.longitude,
    };
    
    this.schools.set(id, updatedSchool);
    return updatedSchool;
  }

  async deleteSchool(id: number): Promise<boolean> {
    return this.schools.delete(id);
  }

  // Sports
  async getSports(): Promise<Sport[]> {
    return Array.from(this.sports.values());
  }

  async getSport(id: number): Promise<Sport | undefined> {
    return this.sports.get(id);
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const id = this.currentSportId++;
    const newSport: Sport = { ...sport, id };
    this.sports.set(id, newSport);
    return newSport;
  }

  // Games
  async getGames(): Promise<(Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport })[]> {
    const games = Array.from(this.games.values());
    return games.map(game => ({
      ...game,
      homeTeam: game.homeTeamId ? this.schools.get(game.homeTeamId) || null : null,
      awayTeam: game.awayTeamId ? this.schools.get(game.awayTeamId) || null : null,
      sport: this.sports.get(game.sportId)!,
    }));
  }

  async getGamesBySport(sportId: number): Promise<(Game & { homeTeam: School | null; awayTeam: School | null; sport: Sport })[]> {
    const games = Array.from(this.games.values()).filter(game => game.sportId === sportId);  
    return games.map(game => ({
      ...game,
      homeTeam: game.homeTeamId ? this.schools.get(game.homeTeamId) || null : null,
      awayTeam: game.awayTeamId ? this.schools.get(game.awayTeamId) || null : null,
      sport: this.sports.get(game.sportId)!,
    }));
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const newGame: Game = { 
      ...game, 
      id,
      homeTeamId: game.homeTeamId || null,
      awayTeamId: game.awayTeamId || null,
      homeScore: game.homeScore || null,
      awayScore: game.awayScore || null,
      isCompleted: game.isCompleted || false,
      homeTeamName: game.homeTeamName || null,
      awayTeamName: game.awayTeamName || null,
      isConferenceGame: game.isConferenceGame !== undefined ? game.isConferenceGame : true,
      location: game.location || null,
      level: game.level || null,
      notes: game.notes || null,
      externalEventId: game.externalEventId || null,
      uploadedBy: game.uploadedBy || null,
      createdAt: game.createdAt || new Date()
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined> {
    const existing = this.games.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...game };
    this.games.set(id, updated);
    return updated;
  }

  async updateGameResult(gameResult: any, userId: number): Promise<Game | undefined> {
    const game = this.games.get(gameResult.gameId);
    if (!game) return undefined;

    // Update the game with scores and additional details
    const updatedGame: Game = {
      ...game,
      homeScore: gameResult.homeScore,
      awayScore: gameResult.awayScore,
      isCompleted: true,
      gameSummary: gameResult.gameSummary || null,
      keyPlayers: gameResult.keyPlayers || null,
      gameHighlights: gameResult.gameHighlights || null,
      nextGameInfo: gameResult.nextGameInfo || null,
      recordAfterGame: gameResult.recordAfterGame || null,
      conferenceRecord: gameResult.conferenceRecord || null,
    };

    this.games.set(gameResult.gameId, updatedGame);
    return updatedGame;
  }

  // Standings
  async getStandings(): Promise<(Standing & { school: School; sport: Sport })[]> {
    const standings = Array.from(this.standings.values());
    return standings.map(standing => ({
      ...standing,
      school: this.schools.get(standing.schoolId)!,
      sport: this.sports.get(standing.sportId)!,
    }));
  }

  async getStandingsBySport(sportId: number): Promise<(Standing & { school: School; sport: Sport })[]> {
    const standings = Array.from(this.standings.values()).filter(standing => standing.sportId === sportId);
    return standings.map(standing => ({
      ...standing,
      school: this.schools.get(standing.schoolId)!,
      sport: this.sports.get(standing.sportId)!,
    })).sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses);
      const bWinPct = b.wins / (b.wins + b.losses);
      return bWinPct - aWinPct;
    });
  }

  async createStanding(standing: InsertStanding): Promise<Standing> {
    const id = this.currentStandingId++;
    const newStanding: Standing = { 
      ...standing, 
      id,
      wins: standing.wins || 0,
      losses: standing.losses || 0
    };
    this.standings.set(id, newStanding);
    return newStanding;
  }

  async updateStanding(id: number, standing: Partial<InsertStanding>): Promise<Standing | undefined> {
    const existing = this.standings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...standing };
    this.standings.set(id, updated);
    return updated;
  }

  // News
  async getNews(): Promise<News[]> {
    return Array.from(this.news.values()).sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  async getNewsById(id: number): Promise<News | undefined> {
    return this.news.get(id);
  }

  async createNews(news: InsertNews): Promise<News> {
    const id = this.currentNewsId++;
    const newNews: News = { 
      ...news, 
      id,
      imageUrl: news.imageUrl || null
    };
    this.news.set(id, newNews);
    return newNews;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const newContact: Contact = { 
      ...contact, 
      id, 
      createdAt: new Date(),
      school: contact.school || null
    };
    this.contacts.set(id, newContact);
    return newContact;
  }

  // Stub implementations for new features (use DatabaseStorage for production)
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async createUser(user: InsertUser): Promise<User> { return { ...user, id: 1, createdAt: new Date(), isActive: true }; }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> { return undefined; }
  async getNewsUpdated(): Promise<(NewsUpdated & { author: User })[]> { return []; }
  async getNewsUpdatedById(id: number): Promise<(NewsUpdated & { author: User }) | undefined> { return undefined; }
  async createNewsUpdated(news: InsertNewsUpdated): Promise<NewsUpdated> { return { ...news, id: 1, isPublished: true, excerpt: news.excerpt || null, imageUrl: news.imageUrl || null, pdfUrl: news.pdfUrl || null }; }
  async updateNewsUpdated(id: number, news: Partial<InsertNewsUpdated>): Promise<NewsUpdated | undefined> { return undefined; }
  async getGameResultSubmissions(): Promise<(GameResultSubmission & { game: Game & { homeTeam: School; awayTeam: School; sport: Sport } })[]> { return []; }
  async createGameResultSubmission(submission: InsertGameResultSubmission): Promise<GameResultSubmission> { return { ...submission, id: 1, submissionDate: new Date(), isModerated: false, moderatedBy: null, moderationNotes: null }; }
  async moderateGameResultSubmission(id: number, moderatedBy: number, notes?: string): Promise<GameResultSubmission | undefined> { return undefined; }
  async getConferenceOfficials(): Promise<(ConferenceOfficial & { school: School })[]> { return []; }
  async getActiveConferenceOfficials(): Promise<(ConferenceOfficial & { school: School })[]> { return []; }
  async createConferenceOfficial(official: InsertConferenceOfficial): Promise<ConferenceOfficial> { return { ...official, id: 1, isActive: true, endDate: official.endDate || null }; }
  async updateConferenceOfficial(id: number, official: Partial<InsertConferenceOfficial>): Promise<ConferenceOfficial | undefined> { return undefined; }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  // Schools
  async getSchools(): Promise<School[]> {
    return await db.select().from(schools);
  }

  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await db
      .insert(schools)
      .values(insertSchool)
      .returning();
    return school;
  }

  async updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined> {
    const [updatedSchool] = await db
      .update(schools)
      .set(school)
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool || undefined;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const result = await db
      .delete(schools)
      .where(eq(schools.id, id))
      .returning();
    return result.length > 0;
  }

  // Sports
  async getSports(): Promise<Sport[]> {
    return await db.select().from(sports);
  }

  async getSport(id: number): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.id, id));
    return sport || undefined;
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const [newSport] = await db
      .insert(sports)
      .values(sport)
      .returning();
    return newSport;
  }

  // Games
  async getGames(): Promise<(Game & { homeTeam: School; awayTeam: School; sport: Sport })[]> {
    const result = await db
      .select({
        game: games,
        homeTeam: schools,
        sport: sports,
      })
      .from(games)
      .leftJoin(schools, eq(games.homeTeamId, schools.id))
      .leftJoin(sports, eq(games.sportId, sports.id));

    // Get away teams separately
    const gamesWithDetails = [];
    for (const row of result) {
      const [awayTeam] = await db.select().from(schools).where(eq(schools.id, row.game.awayTeamId));
      gamesWithDetails.push({
        ...row.game,
        homeTeam: row.homeTeam!,
        awayTeam: awayTeam!,
        sport: row.sport!,
      });
    }

    return gamesWithDetails;
  }

  async getGamesBySport(sportId: number): Promise<(Game & { homeTeam: School; awayTeam: School; sport: Sport })[]> {
    const result = await db
      .select({
        game: games,
        homeTeam: schools,
        sport: sports,
      })
      .from(games)
      .leftJoin(schools, eq(games.homeTeamId, schools.id))
      .leftJoin(sports, eq(games.sportId, sports.id))
      .where(eq(games.sportId, sportId));

    // Get away teams separately
    const gamesWithDetails = [];
    for (const row of result) {
      const [awayTeam] = await db.select().from(schools).where(eq(schools.id, row.game.awayTeamId));
      gamesWithDetails.push({
        ...row.game,
        homeTeam: row.homeTeam!,
        awayTeam: awayTeam!,
        sport: row.sport!,
      });
    }

    return gamesWithDetails;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db
      .insert(games)
      .values(game)
      .returning();
    return newGame;
  }

  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined> {
    const [updatedGame] = await db
      .update(games)
      .set(game)
      .where(eq(games.id, id))
      .returning();
    return updatedGame || undefined;
  }

  // Standings
  async getStandings(): Promise<(Standing & { school: School; sport: Sport })[]> {
    const result = await db
      .select({
        standing: standings,
        school: schools,
        sport: sports,
      })
      .from(standings)
      .leftJoin(schools, eq(standings.schoolId, schools.id))
      .leftJoin(sports, eq(standings.sportId, sports.id));

    return result.map(row => ({
      ...row.standing,
      school: row.school!,
      sport: row.sport!,
    }));
  }

  async getStandingsBySport(sportId: number): Promise<(Standing & { school: School; sport: Sport })[]> {
    const result = await db
      .select({
        standing: standings,
        school: schools,
        sport: sports,
      })
      .from(standings)
      .leftJoin(schools, eq(standings.schoolId, schools.id))
      .leftJoin(sports, eq(standings.sportId, sports.id))
      .where(eq(standings.sportId, sportId));

    const standingsWithDetails = result.map(row => ({
      ...row.standing,
      school: row.school!,
      sport: row.sport!,
    }));

    // Sort by win percentage
    return standingsWithDetails.sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses);
      const bWinPct = b.wins / (b.wins + b.losses);
      return bWinPct - aWinPct;
    });
  }

  async createStanding(standing: InsertStanding): Promise<Standing> {
    const [newStanding] = await db
      .insert(standings)
      .values(standing)
      .returning();
    return newStanding;
  }

  async updateStanding(id: number, standing: Partial<InsertStanding>): Promise<Standing | undefined> {
    const [updatedStanding] = await db
      .update(standings)
      .set(standing)
      .where(eq(standings.id, id))
      .returning();
    return updatedStanding || undefined;
  }

  // News
  async getNews(): Promise<News[]> {
    return await db.select().from(news);
  }

  async getNewsById(id: number): Promise<News | undefined> {
    const [article] = await db.select().from(news).where(eq(news.id, id));
    return article || undefined;
  }

  async createNews(newsItem: InsertNews): Promise<News> {
    const [newNews] = await db
      .insert(news)
      .values(newsItem)
      .returning();
    return newNews;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  // Users (Authentication)
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // News Updated (with author support)
  async getNewsUpdated(): Promise<(NewsUpdated & { author: User })[]> {
    const result = await db
      .select({
        news: newsUpdated,
        author: users,
      })
      .from(newsUpdated)
      .leftJoin(users, eq(newsUpdated.authorId, users.id))
      .where(eq(newsUpdated.isPublished, true));

    return result.map(row => ({
      ...row.news,
      author: row.author!,
    }));
  }

  async getNewsUpdatedById(id: number): Promise<(NewsUpdated & { author: User }) | undefined> {
    const [result] = await db
      .select({
        news: newsUpdated,
        author: users,
      })
      .from(newsUpdated)
      .leftJoin(users, eq(newsUpdated.authorId, users.id))
      .where(eq(newsUpdated.id, id));

    if (!result) return undefined;

    return {
      ...result.news,
      author: result.author!,
    };
  }

  async createNewsUpdated(news: InsertNewsUpdated): Promise<NewsUpdated> {
    const [newNews] = await db
      .insert(newsUpdated)
      .values(news)
      .returning();
    return newNews;
  }

  async updateNewsUpdated(id: number, news: Partial<InsertNewsUpdated>): Promise<NewsUpdated | undefined> {
    const [updatedNews] = await db
      .update(newsUpdated)
      .set(news)
      .where(eq(newsUpdated.id, id))
      .returning();
    return updatedNews || undefined;
  }

  // Game Result Submissions
  async getGameResultSubmissions(): Promise<(GameResultSubmission & { game: Game & { homeTeam: School; awayTeam: School; sport: Sport } })[]> {
    const result = await db
      .select({
        submission: gameResultSubmissions,
        game: games,
        homeTeam: schools,
        sport: sports,
      })
      .from(gameResultSubmissions)
      .leftJoin(games, eq(gameResultSubmissions.gameId, games.id))
      .leftJoin(schools, eq(games.homeTeamId, schools.id))
      .leftJoin(sports, eq(games.sportId, sports.id));

    // Get away teams separately
    const submissionsWithDetails = [];
    for (const row of result) {
      const [awayTeam] = await db.select().from(schools).where(eq(schools.id, row.game!.awayTeamId));
      submissionsWithDetails.push({
        ...row.submission,
        game: {
          ...row.game!,
          homeTeam: row.homeTeam!,
          awayTeam: awayTeam!,
          sport: row.sport!,
        },
      });
    }

    return submissionsWithDetails;
  }

  async createGameResultSubmission(submission: InsertGameResultSubmission): Promise<GameResultSubmission> {
    const [newSubmission] = await db
      .insert(gameResultSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async moderateGameResultSubmission(id: number, moderatedBy: number, notes?: string): Promise<GameResultSubmission | undefined> {
    const [updatedSubmission] = await db
      .update(gameResultSubmissions)
      .set({
        isModerated: true,
        moderatedBy,
        moderationNotes: notes || null,
      })
      .where(eq(gameResultSubmissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

  // Conference Officials
  async getConferenceOfficials(): Promise<(ConferenceOfficial & { school: School })[]> {
    const result = await db
      .select({
        official: conferenceOfficials,
        school: schools,
      })
      .from(conferenceOfficials)
      .leftJoin(schools, eq(conferenceOfficials.schoolId, schools.id));

    return result.map(row => ({
      ...row.official,
      school: row.school!,
    }));
  }

  async getActiveConferenceOfficials(): Promise<(ConferenceOfficial & { school: School })[]> {
    const result = await db
      .select({
        official: conferenceOfficials,
        school: schools,
      })
      .from(conferenceOfficials)
      .leftJoin(schools, eq(conferenceOfficials.schoolId, schools.id))
      .where(eq(conferenceOfficials.isActive, true));

    return result.map(row => ({
      ...row.official,
      school: row.school!,
    }));
  }

  async createConferenceOfficial(official: InsertConferenceOfficial): Promise<ConferenceOfficial> {
    const [newOfficial] = await db
      .insert(conferenceOfficials)
      .values(official)
      .returning();
    return newOfficial;
  }

  async updateConferenceOfficial(id: number, official: Partial<InsertConferenceOfficial>): Promise<ConferenceOfficial | undefined> {
    const [updatedOfficial] = await db
      .update(conferenceOfficials)
      .set(official)
      .where(eq(conferenceOfficials.id, id))
      .returning();
    return updatedOfficial || undefined;
  }
}

export const storage: IStorage = new DatabaseStorage();
