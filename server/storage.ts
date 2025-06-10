import { 
  schools, sports, games, standings, news, contacts,
  type School, type Sport, type Game, type Standing, type News, type Contact,
  type InsertSchool, type InsertSport, type InsertGame, type InsertStanding, 
  type InsertNews, type InsertContact 
} from "@shared/schema";

export interface IStorage {
  // Schools
  getSchools(): Promise<School[]>;
  getSchool(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;

  // Sports
  getSports(): Promise<Sport[]>;
  getSport(id: number): Promise<Sport | undefined>;
  createSport(sport: InsertSport): Promise<Sport>;

  // Games
  getGames(): Promise<(Game & { homeTeam: School; awayTeam: School; sport: Sport })[]>;
  getGamesBySport(sportId: number): Promise<(Game & { homeTeam: School; awayTeam: School; sport: Sport })[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;

  // Standings
  getStandings(): Promise<(Standing & { school: School; sport: Sport })[]>;
  getStandingsBySport(sportId: number): Promise<(Standing & { school: School; sport: Sport })[]>;
  createStanding(standing: InsertStanding): Promise<Standing>;
  updateStanding(id: number, standing: Partial<InsertStanding>): Promise<Standing | undefined>;

  // News
  getNews(): Promise<News[]>;
  getNewsById(id: number): Promise<News | undefined>;
  createNews(news: InsertNews): Promise<News>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
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
    // Initialize schools
    const schoolsData = [
      { name: "Central Valley High", mascot: "Eagles", location: "Riverside, IL", imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Westfield Academy", mascot: "Warriors", location: "Westfield, IL", imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Northbrook High", mascot: "Panthers", location: "Northbrook, IL", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Southside Prep", mascot: "Falcons", location: "Southside, IL", imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Lincoln Heights", mascot: "Lions", location: "Lincoln, IL", imageUrl: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Riverside High", mascot: "Wildcats", location: "Riverside, IL", imageUrl: "https://images.unsplash.com/photo-1576495199011-eb94736d05d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Valley View", mascot: "Vikings", location: "Valley View, IL", imageUrl: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
      { name: "Maple Grove", mascot: "Bears", location: "Maple Grove, IL", imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" },
    ];

    schoolsData.forEach(school => {
      const id = this.currentSchoolId++;
      this.schools.set(id, { ...school, id });
    });

    // Initialize sports
    const sportsData = [
      { name: "Football", season: "fall" },
      { name: "Basketball", season: "winter" },
      { name: "Soccer", season: "fall" },
      { name: "Baseball", season: "spring" },
      { name: "Track & Field", season: "spring" },
      { name: "Volleyball", season: "fall" },
    ];

    sportsData.forEach(sport => {
      const id = this.currentSportId++;
      this.sports.set(id, { ...sport, id });
    });

    // Initialize sample games
    const gamesData = [
      { homeTeamId: 1, awayTeamId: 2, sportId: 1, gameDate: new Date("2024-10-15"), gameTime: "7:00 PM", homeScore: 28, awayScore: 14, isCompleted: true },
      { homeTeamId: 3, awayTeamId: 5, sportId: 1, gameDate: new Date("2024-10-22"), gameTime: "7:30 PM", homeScore: 21, awayScore: 17, isCompleted: true },
      { homeTeamId: 6, awayTeamId: 7, sportId: 1, gameDate: new Date("2024-10-29"), gameTime: "7:00 PM", homeScore: null, awayScore: null, isCompleted: false },
      { homeTeamId: 4, awayTeamId: 8, sportId: 1, gameDate: new Date("2024-11-05"), gameTime: "7:30 PM", homeScore: null, awayScore: null, isCompleted: false },
    ];

    gamesData.forEach(game => {
      const id = this.currentGameId++;
      this.games.set(id, { ...game, id });
    });

    // Initialize standings
    const standingsData = [
      { schoolId: 1, sportId: 1, wins: 7, losses: 1, season: "2024-2025" },
      { schoolId: 3, sportId: 1, wins: 6, losses: 2, season: "2024-2025" },
      { schoolId: 6, sportId: 1, wins: 5, losses: 3, season: "2024-2025" },
      { schoolId: 5, sportId: 1, wins: 4, losses: 4, season: "2024-2025" },
      { schoolId: 2, sportId: 2, wins: 12, losses: 2, season: "2024-2025" },
      { schoolId: 7, sportId: 2, wins: 10, losses: 4, season: "2024-2025" },
      { schoolId: 8, sportId: 2, wins: 8, losses: 6, season: "2024-2025" },
      { schoolId: 4, sportId: 2, wins: 7, losses: 7, season: "2024-2025" },
    ];

    standingsData.forEach(standing => {
      const id = this.currentStandingId++;
      this.standings.set(id, { ...standing, id });
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
      this.news.set(id, { ...article, id });
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
    const newSchool: School = { ...school, id };
    this.schools.set(id, newSchool);
    return newSchool;
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
  async getGames(): Promise<(Game & { homeTeam: School; awayTeam: School; sport: Sport })[]> {
    const games = Array.from(this.games.values());
    return games.map(game => ({
      ...game,
      homeTeam: this.schools.get(game.homeTeamId)!,
      awayTeam: this.schools.get(game.awayTeamId)!,
      sport: this.sports.get(game.sportId)!,
    }));
  }

  async getGamesBySport(sportId: number): Promise<(Game & { homeTeam: School; awayTeam: School; sport: Sport })[]> {
    const games = Array.from(this.games.values()).filter(game => game.sportId === sportId);
    return games.map(game => ({
      ...game,
      homeTeam: this.schools.get(game.homeTeamId)!,
      awayTeam: this.schools.get(game.awayTeamId)!,
      sport: this.sports.get(game.sportId)!,
    }));
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const newGame: Game = { ...game, id };
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
    const newStanding: Standing = { ...standing, id };
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
    const newNews: News = { ...news, id };
    this.news.set(id, newNews);
    return newNews;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const newContact: Contact = { ...contact, id, createdAt: new Date() };
    this.contacts.set(id, newContact);
    return newContact;
  }
}

export const storage = new MemStorage();
