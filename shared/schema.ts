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
  homeTeamId: integer("home_team_id").references(() => schools.id).notNull(),
  awayTeamId: integer("away_team_id").references(() => schools.id).notNull(),
  sportId: integer("sport_id").references(() => sports.id).notNull(),
  gameDate: timestamp("game_date").notNull(),
  gameTime: text("game_time").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isCompleted: boolean("is_completed").default(false),
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

export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true });
export const insertSportSchema = createInsertSchema(sports).omit({ id: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertStandingSchema = createInsertSchema(standings).omit({ id: true });
export const insertNewsSchema = createInsertSchema(news).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });

export type School = typeof schools.$inferSelect;
export type Sport = typeof sports.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Standing = typeof standings.$inferSelect;
export type News = typeof news.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSport = z.infer<typeof insertSportSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertStanding = z.infer<typeof insertStandingSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
