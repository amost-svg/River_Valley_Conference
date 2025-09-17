import { pgTable, text, serial, integer, timestamp, boolean, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mascot: text("mascot").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  phoneNumber: text("phone_number"),
  superintendentName: text("superintendent_name"),
  principalName: text("principal_name"),
  athleticDirectorName: text("athletic_director_name"),
  website: text("website"),
  athleticWebsite: text("athletic_website"),
  ihsaPageLink: text("ihsa_page_link"),
  missionStatement: text("mission_statement"),
  imageUrl: text("image_url"),
  liveStreamingUrl: text("live_streaming_url"),
  liveStreamingPlatform: text("live_streaming_platform"), // "YouTube", "NFHS Network", etc.
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  season: text("season").notNull(), // "fall", "winter", "spring"
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id").references(() => schools.id),
  awayTeamId: integer("away_team_id").references(() => schools.id),
  sportId: integer("sport_id").references(() => sports.id).notNull(),
  gameDate: timestamp("game_date").notNull(),
  gameTime: text("game_time").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isCompleted: boolean("is_completed").default(false),
  // Enhanced fields for non-conference games
  homeTeamName: text("home_team_name"), // For non-RVC opponents
  awayTeamName: text("away_team_name"), // For non-RVC opponents
  isConferenceGame: boolean("is_conference_game").default(true),
  location: text("location"),
  level: text("level"), // "JV", "Varsity", "Both"
  notes: text("notes"),
  externalEventId: text("external_event_id"), // For tracking imported calendar events
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
  // Duplicate management fields
  isDuplicateResolved: boolean("is_duplicate_resolved").default(false),
  duplicateOfGameId: integer("duplicate_of_game_id"),
  gameOwnerSchoolId: integer("game_owner_school_id").references(() => schools.id), // Usually home team
  // Enhanced game results for newspaper reporting
  gameSummary: text("game_summary"), // Brief game summary for media
  keyPlayers: text("key_players"), // JSON array of player highlights
  gameHighlights: text("game_highlights"), // Key moments or plays
  nextGameInfo: text("next_game_info"), // Information about upcoming games
  recordAfterGame: text("record_after_game"), // Team record after this game
  conferenceRecord: text("conference_record"), // Conference record after this game
  resultEnteredBy: integer("result_entered_by"),
  resultEnteredAt: timestamp("result_entered_at"),
});

export const standings = pgTable("standings", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  sportId: integer("sport_id").references(() => sports.id).notNull(),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  ties: integer("ties").default(0).notNull(),
  conferenceWins: integer("conference_wins").default(0).notNull(),
  conferenceLosses: integer("conference_losses").default(0).notNull(),
  conferenceTies: integer("conference_ties").default(0).notNull(),
  pointsFor: integer("points_for").default(0).notNull(),
  pointsAgainst: integer("points_against").default(0).notNull(),
  season: text("season").notNull(), // "2024-2025"
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  publishDate: timestamp("publish_date").notNull(),
  imageUrl: text("image_url"),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  school: text("school"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"), // Make password optional for Google OAuth users
  name: text("name").notNull(),
  role: text("role").notNull(), // "AD" (Athletic Director), "Principal", or "SuperAdmin"
  schoolId: integer("school_id").references(() => schools.id),
  isActive: boolean("is_active").default(true),
  isSuperAdmin: boolean("is_super_admin").default(false),
  googleId: text("google_id"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  createdBy: integer("created_by"),
});

// Updated news table with author and PDF support
export const newsUpdated = pgTable("news_updated", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: text("category").notNull(),
  publishDate: timestamp("publish_date").notNull(),
  imageUrl: text("image_url"),
  pdfUrl: text("pdf_url"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  isPublished: boolean("is_published").default(true),
});

// Game results submissions from visitors
export const gameResultSubmissions = pgTable("game_result_submissions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  submissionDate: timestamp("submission_date").defaultNow(),
  isModerated: boolean("is_moderated").default(false),
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderationNotes: text("moderation_notes"),
});

// Conference officials/officers
export const conferenceOfficials = pgTable("conference_officials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(), // "President", "Vice-President", "Treasurer", "AD Liaison"
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  email: text("email").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
});

// Seasons table to track athletic seasons
export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "2024-25", "2025-26", etc.
  code: text("code").notNull().unique(), // "2425", "2526", etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// CSV upload tracking and audit logs
export const csvUploads = pgTable("csv_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
  status: text("status").notNull(), // "processing", "completed", "failed"
  gamesImported: integer("games_imported").default(0),
  duplicatesSkipped: integer("duplicates_skipped").default(0),
  errorsEncountered: integer("errors_encountered").default(0),
  processingLog: text("processing_log"), // JSON string of detailed logs
  seasonsCovered: text("seasons_covered"), // JSON array of season codes
  sportsIncluded: text("sports_included"), // JSON array of sports
});

// Game edit audit log to track changes made by ADs
export const gameEditLogs = pgTable("game_edit_logs", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  editedBy: integer("edited_by").references(() => users.id).notNull(),
  editDate: timestamp("edit_date").defaultNow(),
  fieldName: text("field_name").notNull(), // "homeScore", "awayScore", "gameDate", etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  editReason: text("edit_reason"), // Optional reason for the change
});

// CSV data mapping to maintain relationship between imported CSV records and games
export const csvGameMappings = pgTable("csv_game_mappings", {
  id: serial("id").primaryKey(),
  csvUploadId: integer("csv_upload_id").references(() => csvUploads.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  csvRowData: text("csv_row_data"), // JSON string of original CSV row data
  rvcGameId: text("rvc_game_id"), // Original RVC game ID from CSV if present
  importedAt: timestamp("imported_at").defaultNow(),
});

// Sport-specific game results table
export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  scoringType: text("scoring_type").notNull(), // "set_match", "aggregate_with_periods", "aggregate_with_tiebreaker", "inning_line", etc.
  details: jsonb("details").$type<Record<string, any>>().notNull(), // JSON object of sport-specific scoring data
  homeTotal: integer("home_total").notNull(),
  awayTotal: integer("away_total").notNull(),
  winnerTeamId: integer("winner_team_id").references(() => schools.id),
  decidedBy: text("decided_by"), // "regulation", "overtime", "penalty_kicks", "extra_innings", etc.
  createdAt: timestamp("created_at").defaultNow(),
  enteredBy: integer("entered_by").references(() => users.id).notNull(), // FK to users table
  enteredByName: text("entered_by_name").notNull(), // Display name for the person who entered the result
}, (table) => ({
  uniqueGameId: unique("unique_game_id").on(table.gameId),
  gameIdIdx: index("game_results_game_id_idx").on(table.gameId),
  winnerTeamIdIdx: index("game_results_winner_team_id_idx").on(table.winnerTeamId),
  createdAtIdx: index("game_results_created_at_idx").on(table.createdAt),
}));

export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true });
export const insertSportSchema = createInsertSchema(sports).omit({ id: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertStandingSchema = createInsertSchema(standings).omit({ id: true });
export const insertNewsSchema = createInsertSchema(news).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertNewsUpdatedSchema = createInsertSchema(newsUpdated).omit({ id: true });
export const insertGameResultSubmissionSchema = createInsertSchema(gameResultSubmissions).omit({ id: true, submissionDate: true });
export const insertConferenceOfficialSchema = createInsertSchema(conferenceOfficials).omit({ id: true });
export const insertSeasonSchema = createInsertSchema(seasons).omit({ id: true, createdAt: true });
export const insertCsvUploadSchema = createInsertSchema(csvUploads).omit({ id: true, uploadDate: true });
export const insertGameEditLogSchema = createInsertSchema(gameEditLogs).omit({ id: true, editDate: true });
export const insertCsvGameMappingSchema = createInsertSchema(csvGameMappings).omit({ id: true, importedAt: true });
export const insertGameResultSchema = createInsertSchema(gameResults).omit({ id: true, createdAt: true });

// Enhanced game result schema for Athletic Directors
export const gameResultSchema = z.object({
  gameId: z.number(),
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  gameSummary: z.string().optional(),
  keyPlayers: z.string().optional(),
  gameHighlights: z.string().optional(),
  nextGameInfo: z.string().optional(),
  recordAfterGame: z.string().optional(),
  conferenceRecord: z.string().optional(),
});

// Sport-specific scoring schemas

// Volleyball scoring schema (set match)
export const volleyballSetSchema = z.object({
  setNumber: z.number().int().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  winnerTeam: z.enum(['home', 'away']),
});

export const volleyballScoringSchema = z.object({
  bestOf: z.enum(['3', '5']),
  sets: z.array(volleyballSetSchema),
  setsWonHome: z.number().int().min(0),
  setsWonAway: z.number().int().min(0),
  matchWinner: z.enum(['home', 'away']),
});

// Basketball scoring schema (aggregate with periods)
export const basketballPeriodSchema = z.object({
  period: z.number().int().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export const basketballScoringSchema = z.object({
  quarters: z.array(basketballPeriodSchema).length(4),
  overtimePeriods: z.array(basketballPeriodSchema).optional(),
  totalHomeScore: z.number().int().min(0),
  totalAwayScore: z.number().int().min(0),
  winner: z.enum(['home', 'away']),
  decidedBy: z.enum(['regulation', 'overtime']),
});

// Soccer/Football scoring schema (aggregate with tiebreaker)
export const soccerScoringSchema = z.object({
  regulation: z.object({
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
  }),
  extraTime: z.object({
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
  }).optional(),
  penaltyKicks: z.object({
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional(),
    homeMade: z.number().int().min(0).optional(),
    awayMade: z.number().int().min(0).optional(),
    homeAttempts: z.number().int().min(0).optional(),
    awayAttempts: z.number().int().min(0).optional(),
  }).optional(),
  totalHomeScore: z.number().int().min(0),
  totalAwayScore: z.number().int().min(0),
  winner: z.enum(['home', 'away', 'tie']),
  decidedBy: z.enum(['regulation', 'extra_time', 'penalty_kicks']),
});

// Baseball/Softball scoring schema (inning line score)
export const baseballInningSchema = z.object({
  inning: z.number().int().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export const baseballScoringSchema = z.object({
  innings: z.array(baseballInningSchema).min(7), // Min 7 innings for regulation
  extraInnings: z.array(baseballInningSchema).optional(),
  totalHomeScore: z.number().int().min(0),
  totalAwayScore: z.number().int().min(0),
  homeHits: z.number().int().min(0).optional(),
  awayHits: z.number().int().min(0).optional(),
  homeErrors: z.number().int().min(0).optional(),
  awayErrors: z.number().int().min(0).optional(),
  winner: z.enum(['home', 'away']),
  decidedBy: z.enum(['regulation', 'extra_innings']),
});

// Wrestling scoring schema (dual meet)
export const wrestlingMatchSchema = z.object({
  weightClass: z.string(),
  homeWrestler: z.string().optional(),
  awayWrestler: z.string().optional(),
  winner: z.enum(['home', 'away', 'forfeit_home', 'forfeit_away', 'double_forfeit']),
  winType: z.enum(['pin', 'tech_fall', 'major_decision', 'decision', 'forfeit', 'disqualification']).optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  teamPoints: z.number().int().min(0), // Points awarded to team (6 for pin, 3 for decision, etc.)
});

export const wrestlingScoringSchema = z.object({
  matches: z.array(wrestlingMatchSchema),
  totalHomeTeamPoints: z.number().int().min(0),
  totalAwayTeamPoints: z.number().int().min(0),
  winner: z.enum(['home', 'away', 'tie']),
});

// Track & Field scoring schema
export const trackEventResultSchema = z.object({
  event: z.string(),
  place: z.number().int().min(1),
  athlete: z.string(),
  school: z.enum(['home', 'away']),
  performance: z.string(), // Time, distance, or height as string
  points: z.number().int().min(0),
});

export const trackScoringSchema = z.object({
  eventResults: z.array(trackEventResultSchema),
  totalHomePoints: z.number().int().min(0),
  totalAwayPoints: z.number().int().min(0),
  winner: z.enum(['home', 'away', 'tie']),
});

// Cross Country scoring schema
export const crossCountryRunnerSchema = z.object({
  place: z.number().int().min(1),
  name: z.string(),
  school: z.enum(['home', 'away']),
  time: z.string(),
  points: z.number().int().min(0).optional(), // Only for scoring runners
});

export const crossCountryScoringSchema = z.object({
  runners: z.array(crossCountryRunnerSchema),
  homeTeamScore: z.number().int().min(0),
  awayTeamScore: z.number().int().min(0),
  winner: z.enum(['home', 'away']),
  scoringRunners: z.object({
    home: z.array(z.number().int()).length(5), // Top 5 runners' places
    away: z.array(z.number().int()).length(5),
  }),
});

// Tennis scoring schema
export const tennisMatchSchema = z.object({
  position: z.string(), // "1 Singles", "2 Singles", "3 Singles", "1 Doubles", "2 Doubles", "3 Doubles"
  homePlayers: z.string(),
  awayPlayers: z.string(),
  sets: z.array(z.object({
    setNumber: z.number().int().min(1),
    homeGames: z.number().int().min(0),
    awayGames: z.number().int().min(0),
  })),
  winner: z.enum(['home', 'away', 'forfeit_home', 'forfeit_away']),
});

export const tennisScoringSchema = z.object({
  matches: z.array(z.object({
    position: z.string(),
    homePlayers: z.string().optional(),
    awayPlayers: z.string().optional(),
    winner: z.enum(['home', 'away', 'forfeit_home', 'forfeit_away']),
    score: z.string().optional(),
    completed: z.boolean().default(true),
  })),
  homeMatchesWon: z.number().int().min(0),
  awayMatchesWon: z.number().int().min(0),
  winner: z.enum(['home', 'away', 'tie']),
});

// Golf scoring schema
export const golfPlayerSchema = z.object({
  name: z.string(),
  school: z.enum(['home', 'away']),
  holes: z.array(z.number().int().min(1)), // Strokes per hole
  totalStrokes: z.number().int().min(1),
  scoreToPar: z.number().int(), // Can be negative
});

export const golfScoringSchema = z.object({
  players: z.array(z.object({
    name: z.string(),
    school: z.enum(['home', 'away']),
    score: z.number().int().min(18),
    isScoring: z.boolean().default(true),
  })),
  homeTeamTotal: z.number().int().min(0),
  awayTeamTotal: z.number().int().min(0),
  winner: z.enum(['home', 'away', 'tie']),
  scoringPlayers: z.object({
    home: z.array(z.number().int()).optional(),
    away: z.array(z.number().int()).optional(),
  }).optional(),
});

// Unified sport scoring schema with discriminated union
export const sportScoringDetailsSchema = z.discriminatedUnion('sport', [
  z.object({ sport: z.literal('volleyball'), details: volleyballScoringSchema }),
  z.object({ sport: z.literal('basketball'), details: basketballScoringSchema }),
  z.object({ sport: z.literal('soccer'), details: soccerScoringSchema }),
  z.object({ sport: z.literal('football'), details: soccerScoringSchema }), // American football uses similar structure
  z.object({ sport: z.literal('baseball'), details: baseballScoringSchema }),
  z.object({ sport: z.literal('softball'), details: baseballScoringSchema }),
  z.object({ sport: z.literal('wrestling'), details: wrestlingScoringSchema }),
  z.object({ sport: z.literal('track'), details: trackScoringSchema }),
  z.object({ sport: z.literal('cross_country'), details: crossCountryScoringSchema }),
  z.object({ sport: z.literal('tennis'), details: tennisScoringSchema }),
  z.object({ sport: z.literal('golf'), details: golfScoringSchema }),
]);

// Game result entry schema for API endpoints - discriminated union for proper validation
export const gameResultEntrySchema = z.discriminatedUnion('scoringType', [
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('set_match'),
    details: volleyballScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation', 'overtime']).optional(),
    enteredBy: z.number().int().positive(), // FK to users.id
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('aggregate_with_periods'),
    details: basketballScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation', 'overtime']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('aggregate_with_tiebreaker'),
    details: soccerScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation', 'extra_time', 'penalty_kicks']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('inning_line'),
    details: baseballScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation', 'extra_innings']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('dual_meet'),
    details: wrestlingScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('team_points'),
    details: trackScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('runner_places'),
    details: crossCountryScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('match_play'),
    details: tennisScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
  z.object({
    gameId: z.number().int().positive(),
    scoringType: z.literal('stroke_play'),
    details: golfScoringSchema,
    homeTotal: z.number().int().min(0),
    awayTotal: z.number().int().min(0),
    winnerTeamId: z.number().int().positive().optional(),
    decidedBy: z.enum(['regulation']).optional(),
    enteredBy: z.number().int().positive(),
    enteredByName: z.string(),
  }),
]);

export type School = typeof schools.$inferSelect;
export type Sport = typeof sports.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Standing = typeof standings.$inferSelect;
export type News = typeof news.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewsUpdated = typeof newsUpdated.$inferSelect;
export type GameResultSubmission = typeof gameResultSubmissions.$inferSelect;
export type ConferenceOfficial = typeof conferenceOfficials.$inferSelect;

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSport = z.infer<typeof insertSportSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertStanding = z.infer<typeof insertStandingSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertNewsUpdated = z.infer<typeof insertNewsUpdatedSchema>;
export type InsertGameResultSubmission = z.infer<typeof insertGameResultSubmissionSchema>;
export type InsertConferenceOfficial = z.infer<typeof insertConferenceOfficialSchema>;
export type Season = typeof seasons.$inferSelect;
export type CsvUpload = typeof csvUploads.$inferSelect;
export type GameEditLog = typeof gameEditLogs.$inferSelect;
export type CsvGameMapping = typeof csvGameMappings.$inferSelect;
export type GameResultDB = typeof gameResults.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type InsertCsvUpload = z.infer<typeof insertCsvUploadSchema>;
export type InsertGameEditLog = z.infer<typeof insertGameEditLogSchema>;
export type InsertCsvGameMapping = z.infer<typeof insertCsvGameMappingSchema>;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type GameResult = z.infer<typeof gameResultSchema>;
export type GameResultEntry = z.infer<typeof gameResultEntrySchema>;

// Sport-specific scoring types
export type VolleyballSet = z.infer<typeof volleyballSetSchema>;
export type VolleyballScoring = z.infer<typeof volleyballScoringSchema>;
export type BasketballPeriod = z.infer<typeof basketballPeriodSchema>;
export type BasketballScoring = z.infer<typeof basketballScoringSchema>;
export type SoccerScoring = z.infer<typeof soccerScoringSchema>;
export type BaseballInning = z.infer<typeof baseballInningSchema>;
export type BaseballScoring = z.infer<typeof baseballScoringSchema>;
export type WrestlingMatch = z.infer<typeof wrestlingMatchSchema>;
export type WrestlingScoring = z.infer<typeof wrestlingScoringSchema>;
export type TrackEventResult = z.infer<typeof trackEventResultSchema>;
export type TrackScoring = z.infer<typeof trackScoringSchema>;
export type CrossCountryRunner = z.infer<typeof crossCountryRunnerSchema>;
export type CrossCountryScoring = z.infer<typeof crossCountryScoringSchema>;
export type TennisMatch = z.infer<typeof tennisMatchSchema>;
export type TennisScoring = z.infer<typeof tennisScoringSchema>;
export type GolfPlayer = z.infer<typeof golfPlayerSchema>;
export type GolfScoring = z.infer<typeof golfScoringSchema>;
export type SportScoringDetails = z.infer<typeof sportScoringDetailsSchema>;
