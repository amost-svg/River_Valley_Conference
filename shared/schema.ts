import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const standings = pgTable("standings", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  sportId: integer("sport_id").references(() => sports.id).notNull(),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  season: text("season").notNull(), // "2024-2025"
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
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "AD" (Athletic Director) or "Principal"
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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
