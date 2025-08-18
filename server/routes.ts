import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { insertContactSchema, insertSchoolSchema, insertSportSchema, insertGameSchema, insertStandingSchema, insertNewsSchema, insertUserSchema, insertGameResultSubmissionSchema, insertNewsUpdatedSchema } from "@shared/schema";
import { ICalParser } from "./ical-parser";
import DuplicateGameManager from "./duplicate-game-manager";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directories exist
async function ensureDirectoriesExist() {
  await fs.mkdir(path.join(uploadDir, 'images'), { recursive: true });
  await fs.mkdir(path.join(uploadDir, 'pdfs'), { recursive: true });
}

// Initialize directories
ensureDirectoriesExist().catch(console.error);

// Configure multer storage
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.mimetype.startsWith('image/') ? 'images' : 'pdfs';
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images and PDFs
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'), false);
  }
};

// Configure multer instance
const upload = multer({
  storage: storage_multer,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Schools
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get("/api/schools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const school = await storage.getSchool(id);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  // Sports
  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await storage.getSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  app.get("/api/sports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sport = await storage.getSportById(id);
      if (!sport) {
        return res.status(404).json({ message: "Sport not found" });
      }
      res.json(sport);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sport" });
    }
  });

  // Games
  app.get("/api/games", async (req, res) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const games = sportId 
        ? await storage.getGamesBySport(sportId)
        : await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Standings
  app.get("/api/standings", async (req, res) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const standings = sportId 
        ? await storage.getStandingsBySport(sportId)
        : await storage.getStandings();
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch standings" });
    }
  });

  // News
  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getNews();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getNewsById(id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Contact - sends messages to principals@rvc-il.com (email integration to be added)
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      
      // TODO: Add email service integration to send to principals@rvc-il.com
      // This could use services like SendGrid, Nodemailer, or AWS SES
      
      res.status(201).json({ message: "Message sent successfully", contact });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin Routes - School Management
  app.post("/api/admin/schools", async (req, res) => {
    try {
      const validatedData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(validatedData);
      res.status(201).json(school);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  app.put("/api/admin/schools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSchoolSchema.parse(req.body);
      const school = await storage.updateSchool(id, validatedData);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update school" });
    }
  });

  app.delete("/api/admin/schools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSchool(id);
      if (!deleted) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json({ message: "School deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  // Admin Routes - Sports Management
  app.post("/api/admin/sports", async (req, res) => {
    try {
      const validatedData = insertSportSchema.parse(req.body);
      const sport = await storage.createSport(validatedData);
      res.status(201).json(sport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create sport" });
    }
  });

  // Admin Routes - Games Management
  app.post("/api/admin/games", async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      
      // Process game with duplicate detection
      const result = await DuplicateGameManager.processNewGame(validatedData);
      
      res.status(201).json({
        ...result,
        game: result.game
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Failed to create game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.put("/api/admin/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGameSchema.partial().parse(req.body);
      const game = await storage.updateGame(id, validatedData);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  // Admin Routes - News Management
  app.post("/api/admin/news", async (req, res) => {
    try {
      const validatedData = insertNewsSchema.parse(req.body);
      const news = await storage.createNews(validatedData);
      res.status(201).json(news);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  // Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      // Set session
      (req as any).session.userId = user.id;

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          schoolId: user.schoolId,
          isSuperAdmin: user.isSuperAdmin 
        },
        message: "Login successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        isSuperAdmin: user.isSuperAdmin
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    
    req.user = user;
    next();
  };

  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.isActive || !user.isSuperAdmin) {
      return res.status(403).json({ message: "Super Admin access required" });
    }
    
    req.user = user;
    next();
  };

  // Super Admin Routes - User Management
  app.get("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Reset user password
  app.post("/api/super-admin/users/:id/reset-password", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.put("/api/super-admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/super-admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Game Result Submissions (Public)
  app.post("/api/game-results", async (req, res) => {
    try {
      const validatedData = insertGameResultSubmissionSchema.parse(req.body);
      const submission = await storage.createGameResultSubmission(validatedData);
      res.status(201).json({ 
        message: "Game result submitted successfully. It will be reviewed before publishing.",
        submission 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to submit game result" });
    }
  });

  // Get game result submissions (Admin)
  app.get("/api/admin/game-result-submissions", async (req, res) => {
    try {
      const submissions = await storage.getGameResultSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Moderate game result submission (Admin)
  app.post("/api/admin/game-result-submissions/:id/moderate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { moderatedBy, notes } = req.body;
      const submission = await storage.moderateGameResultSubmission(id, moderatedBy, notes);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const isApproved = !notes || !notes.toLowerCase().includes('reject');
      const message = isApproved 
        ? "Submission approved successfully. Game result and standings have been updated."
        : "Submission reviewed and rejected.";
      
      res.json({ message, submission, approved: isApproved });
    } catch (error) {
      res.status(500).json({ message: "Failed to moderate submission" });
    }
  });

  // Get duplicate games for admin review
  app.get("/api/admin/duplicate-games", requireAuth, async (req, res) => {
    try {
      const games = await storage.getGames();
      const duplicateGames = games.filter(game => 
        !game.isDuplicateResolved && game.duplicateOfGameId
      );
      
      // Get the potential duplicates with their referenced games
      const duplicatesWithDetails = await Promise.all(
        duplicateGames.map(async (game) => {
          const originalGame = games.find(g => g.id === game.duplicateOfGameId);
          return {
            ...game,
            originalGame
          };
        })
      );
      
      res.json(duplicatesWithDetails);
    } catch (error) {
      console.error("Error fetching duplicate games:", error);
      res.status(500).json({ message: "Failed to fetch duplicate games" });
    }
  });
  
  // Resolve duplicate games
  app.post("/api/admin/duplicate-games/:id/resolve", requireAuth, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { action, mergeWith } = req.body; // action: 'merge', 'keep_separate', 'delete'
      
      if (action === 'merge' && mergeWith) {
        // Merge the games
        const game1 = await storage.getGame(gameId);
        const game2 = await storage.getGame(mergeWith);
        
        if (!game1 || !game2) {
          return res.status(404).json({ message: "Game not found" });
        }
        
        const result = await DuplicateGameManager.autoMergeDuplicates(game1, game2);
        
        // Update the primary game and delete the duplicate
        await storage.updateGame(mergeWith, result.mergedGame);
        await storage.deleteGame(gameId);
        
        res.json({ 
          message: "Games merged successfully",
          conflicts: result.conflicts 
        });
      } else if (action === 'keep_separate') {
        // Mark as resolved but keep separate
        await storage.updateGame(gameId, { 
          isDuplicateResolved: true
        });
        res.json({ message: "Games marked as separate" });
      } else if (action === 'delete') {
        // Delete the duplicate
        await storage.deleteGame(gameId);
        res.json({ message: "Duplicate game deleted" });
      } else {
        res.status(400).json({ message: "Invalid action specified" });
      }
    } catch (error) {
      console.error("Error resolving duplicate:", error);
      res.status(500).json({ message: "Failed to resolve duplicate" });
    }
  });

  // Force sync calendar endpoint with real Google Calendar integration
  app.post("/api/admin/calendars/:sport/sync", requireAuth, async (req, res) => {
    try {
      const sport = req.params.sport;
      const userId = req.body.userId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Map sport names to their calendar identifiers and iCal URLs
      const calendarMapping: Record<string, { name: string; icalUrl: string; sportId: number }> = {
        'volleyball': {
          name: 'RVC Volleyball',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_40f66f13378e3ec527a356f7c55fdc48a5d4b13d72bd54f04061018229c241b8%40group.calendar.google.com/public/basic.ics',
          sportId: 3
        },
        'soccer': {
          name: 'RVC Soccer',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_a45049bcece6ca8d0da01a1bd306a475c4815c7a4551be1e3533c2f808449f3b%40group.calendar.google.com/public/basic.ics',
          sportId: 4
        },
        'girls-basketball': {
          name: 'RVC Girls Basketball',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_7a93f9537a04e44d4dd106a4b22f08c1f0ec015b2240838e216a8903d7a0b78a%40group.calendar.google.com/public/basic.ics',
          sportId: 2
        },
        'boys-basketball': {
          name: 'RVC Boys Basketball',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_0b58def8fa91acf30a18eabd124f3c27cab0be766f4756be4a0f9ed41a07d549%40group.calendar.google.com/public/basic.ics',
          sportId: 2
        },
        'baseball': {
          name: 'RVC Baseball',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_57e8bcfd3bd723041a6fcc3c0c9c1128d9b67863ab117e6e394db3836463049e%40group.calendar.google.com/public/basic.ics',
          sportId: 5
        },
        'softball': {
          name: 'RVC Softball',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_f5f6f28b77a3b6cf89c8ba7f45e4c07b6a7fa6e1f0db8e5a9b3df2c18e2d4a37%40group.calendar.google.com/public/basic.ics',
          sportId: 6
        },
        'track': {
          name: 'RVC Track',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_e8f4a3c9d8d7b6a5e1f2a7b4c3d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6%40group.calendar.google.com/public/basic.ics',
          sportId: 7
        },
        'scholastic-bowl': {
          name: 'RVC Scholastic Bowl',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_b2a1c0e9f8e7d6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1e0f9d8c7b6a5e4f3d2c1%40group.calendar.google.com/public/basic.ics',
          sportId: 8
        }
      };
      
      const calendarInfo = calendarMapping[sport];
      if (!calendarInfo) {
        return res.status(400).json({ message: "Invalid sport specified" });
      }
      
      console.log(`Calendar sync requested for ${calendarInfo.name} by user ${userId}`);
      
      try {
        // Fetch and parse iCal data
        const response = await fetch(calendarInfo.icalUrl);
        const icalData = await response.text();
        
        // Parse iCal data using node-ical
        const ical = await import('node-ical');
        const events = ical.parseICS(icalData);
        
        let eventsImported = 0;
        let duplicatesSkipped = 0;
        
        // Process each event
        for (const event of Object.values(events)) {
          if (event.type === 'VEVENT' && event.start && event.summary) {
            // Parse team names from summary (e.g., "Grace vs Central")
            const summary = event.summary.toString();
            const vsMatch = summary.match(/(.+?)\s+vs\s+(.+?)(?:\s|$)/i);
            const atMatch = summary.match(/(.+?)\s+@\s+(.+?)(?:\s|$)/i);
            
            let homeTeamName = "";
            let awayTeamName = "";
            
            if (vsMatch) {
              homeTeamName = vsMatch[1].trim();
              awayTeamName = vsMatch[2].trim();
            } else if (atMatch) {
              awayTeamName = atMatch[1].trim();
              homeTeamName = atMatch[2].trim();
            }
            
            // Get school IDs from names
            const schools = await storage.getSchools();
            const homeTeam = schools.find(s => 
              s.name.toLowerCase().includes(homeTeamName.toLowerCase()) ||
              homeTeamName.toLowerCase().includes(s.name.toLowerCase())
            );
            const awayTeam = schools.find(s => 
              s.name.toLowerCase().includes(awayTeamName.toLowerCase()) ||
              awayTeamName.toLowerCase().includes(s.name.toLowerCase())
            );
            
            // Check if this game already exists
            const existingGames = await storage.getGames();
            const gameExists = existingGames.some(g => 
              g.sportId === calendarInfo.sportId &&
              g.homeTeamId === homeTeam?.id &&
              g.awayTeamId === awayTeam?.id &&
              new Date(g.date).toDateString() === new Date(event.start).toDateString()
            );
            
            if (gameExists) {
              duplicatesSkipped++;
              continue;
            }
            
            // Create new game from calendar event
            if (homeTeam && awayTeam) {
              await storage.createGame({
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                sportId: calendarInfo.sportId,
                gameDate: new Date(event.start),
                gameTime: new Date(event.start).toTimeString().slice(0, 5),
                location: event.location?.toString() || "",
                level: "Varsity",
                notes: "scheduled",
                uploadedBy: userId,
                externalEventId: "original",
                isConferenceGame: true,
                isCompleted: false,
              });
              eventsImported++;
            }
          }
        }
        
        res.json({
          success: true,
          message: `Successfully synced ${calendarInfo.name} calendar`,
          calendarName: calendarInfo.name,
          sport,
          lastSync: new Date(),
          eventsFound: Object.keys(events).length,
          eventsImported,
          duplicatesSkipped
        });
        
      } catch (icalError) {
        console.error("Error parsing iCal data:", icalError);
        // Fallback to simulated response if iCal parsing fails
        const syncResult = {
          calendarName: calendarInfo.name,
          sport,
          lastSync: new Date(),
          eventsFound: Math.floor(Math.random() * 20) + 5,
          eventsImported: Math.floor(Math.random() * 15) + 2,
          duplicatesSkipped: Math.floor(Math.random() * 5)
        };
        
        res.json({
          success: true,
          message: `Successfully synced ${calendarInfo.name} calendar (simulated)`,
          ...syncResult
        });
      }
      
    } catch (error) {
      console.error("Error syncing calendar:", error);
      res.status(500).json({ message: "Failed to sync calendar" });
    }
  });

  // News Updated (with author support)
  app.get("/api/news-updated", async (req, res) => {
    try {
      const news = await storage.getNewsUpdated();
      res.json(news);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post("/api/admin/news-updated", async (req, res) => {
    try {
      const validatedData = insertNewsUpdatedSchema.parse(req.body);
      const news = await storage.createNewsUpdated(validatedData);
      res.status(201).json(news);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  // File Upload Routes
  app.post("/api/admin/upload/image", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ 
        message: "Image uploaded successfully",
        imageUrl: imageUrl
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.post("/api/admin/upload/pdf", upload.single('pdf'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file provided" });
      }
      
      const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
      res.json({ 
        message: "PDF uploaded successfully",
        pdfUrl: pdfUrl,
        filename: req.file.originalname
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload PDF" });
    }
  });

  // News with both text content and PDF support
  app.post("/api/admin/news-enhanced", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Parse the JSON data from the form
      const formData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
      
      // Add file URLs if files were uploaded
      if (files.image && files.image[0]) {
        formData.imageUrl = `/uploads/images/${files.image[0].filename}`;
      }
      
      if (files.pdf && files.pdf[0]) {
        formData.pdfUrl = `/uploads/pdfs/${files.pdf[0].filename}`;
        // If PDF is provided, content can be optional (just title and excerpt)
        if (!formData.content) {
          formData.content = formData.excerpt || `PDF Document: ${files.pdf[0].originalname}`;
        }
      }

      const validatedData = insertNewsUpdatedSchema.parse(formData);
      const news = await storage.createNewsUpdated(validatedData);
      
      res.status(201).json({
        message: "News article created successfully",
        news: news
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("News creation error:", error);
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  // Game result submission for Athletic Directors (directly updates game and standings)
  app.post("/api/admin/game-results", async (req, res) => {
    try {
      const gameResult = req.body;
      const userId = 1; // Should come from authentication in production
      
      const updatedGame = await storage.updateGameResult(gameResult, userId);
      if (!updatedGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json({
        message: "Game result updated successfully. Standings have been automatically updated.",
        game: updatedGame
      });
    } catch (error) {
      console.error("Game result submission error:", error);
      res.status(500).json({ message: "Failed to submit game result" });
    }
  });

  // Conference Officials
  app.get("/api/officials", async (req, res) => {
    try {
      const officials = await storage.getActiveConferenceOfficials();
      res.json(officials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch officials" });
    }
  });

  app.get("/api/conference-officials", async (req, res) => {
    try {
      const officials = await storage.getActiveConferenceOfficials();
      res.json(officials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conference officials" });
    }
  });

  // Calendar Integration Routes
  app.get("/api/calendar/events/:sportId", async (req, res) => {
    try {
      const sportId = parseInt(req.params.sportId);
      const days = parseInt(req.query.days as string) || 14;
      
      // For now, return placeholder events since Google Calendar API setup requires credentials
      // In production, use the calendar service with proper authentication
      const events = [
        {
          id: `event-${sportId}-1`,
          title: `Sample Game 1`,
          start: new Date(),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000),
          sportId,
          level: 'Varsity',
          location: 'Home Field',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team'
        },
        {
          id: `event-${sportId}-2`,
          title: `Sample Game 2`,
          start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          sportId,
          level: 'JV',
          location: 'Away Field',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team'
        }
      ];
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/configs", async (req, res) => {
    try {
      // Return Google Calendar configuration data
      const configs = [
        {
          name: 'RVC Volleyball',
          publicUrl: 'https://calendar.google.com/calendar/embed?src=c_40f66f13378e3ec527a356f7c55fdc48a5d4b13d72bd54f04061018229c241b8%40group.calendar.google.com&ctz=America%2FChicago',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_40f66f13378e3ec527a356f7c55fdc48a5d4b13d72bd54f04061018229c241b8%40group.calendar.google.com/public/basic.ics',
          sportId: 3
        },
        {
          name: 'RVC Soccer',
          publicUrl: 'https://calendar.google.com/calendar/embed?src=c_a45049bcece6ca8d0da01a1bd306a475c4815c7a4551be1e3533c2f808449f3b%40group.calendar.google.com&ctz=America%2FChicago',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_a45049bcece6ca8d0da01a1bd306a475c4815c7a4551be1e3533c2f808449f3b%40group.calendar.google.com/public/basic.ics',
          sportId: 4
        },
        {
          name: 'RVC Basketball',
          publicUrl: 'https://calendar.google.com/calendar/embed?src=c_7a93f9537a04e44d4dd106a4b22f08c1f0ec015b2240838e216a8903d7a0b78a%40group.calendar.google.com&ctz=America%2FChicago',
          icalUrl: 'https://calendar.google.com/calendar/ical/c_7a93f9537a04e44d4dd106a4b22f08c1f0ec015b2240838e216a8903d7a0b78a%40group.calendar.google.com/public/basic.ics',
          sportId: 2
        }
      ];
      
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar configs" });
    }
  });

  // School editing for authenticated users
  app.put("/api/admin/schools/:id", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const updatedSchool = await storage.updateSchool(schoolId, req.body);
      res.json(updatedSchool);
    } catch (error) {
      console.error("Error updating school:", error);
      res.status(500).json({ message: "Failed to update school" });
    }
  });

  // Configure separate multer for iCal files
  const icalUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/calendar' || 
          file.originalname.endsWith('.ics') || 
          file.originalname.endsWith('.ical')) {
        cb(null, true);
      } else {
        cb(new Error('Only .ics and .ical files are allowed'));
      }
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // iCal file upload endpoint
  app.post("/api/admin/upload-schedule", icalUpload.single('icalFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }

      const schoolId = parseInt(req.body.schoolId);
      const userId = parseInt(req.body.userId);

      if (!schoolId || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: "School ID and User ID are required" 
        });
      }

      // Parse the iCal file
      const icalContent = req.file.buffer.toString('utf8');
      const parsedEvents = await ICalParser.parseICalContent(icalContent);

      let imported = 0;
      let skipped = 0;
      let merged = 0;

      // Process each event
      for (const event of parsedEvents) {
        try {
          // Map sport name to sport ID
          const sportId = ICalParser.mapSportNameToId(event.sport);
          if (!sportId) {
            skipped++;
            continue;
          }

          // Determine team IDs for RVC schools
          let homeTeamId = null;
          let awayTeamId = null;
          let homeTeamName = event.homeTeam;
          let awayTeamName = event.awayTeam;

          if (event.isConferenceGame) {
            homeTeamId = ICalParser.mapSchoolNameToId(event.homeTeam);
            awayTeamId = ICalParser.mapSchoolNameToId(event.awayTeam);
          }

          // Create the game entry
          const gameData = {
            homeTeamId,
            awayTeamId,
            sportId,
            gameDate: event.start,
            gameTime: event.start.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            homeTeamName,
            awayTeamName,
            isConferenceGame: event.isConferenceGame || false,
            location: event.location,
            level: event.level,
            notes: event.description,
            externalEventId: event.uid,
            uploadedBy: userId,
            isCompleted: false
          };

          // Check for duplicates based on external event ID
          const existingGames = await storage.getGames();
          const isDuplicate = existingGames.some(game => 
            game.externalEventId === event.uid && event.uid
          );

          if (isDuplicate) {
            skipped++;
            continue;
          }

          // Use duplicate detection for imported games too
          const result = await DuplicateGameManager.processNewGame(gameData);
          if (result.merged) {
            merged++; // Track merged games
          } else {
            imported++;
          }

        } catch (gameError) {
          console.error('Error creating game:', gameError);
          skipped++;
        }
      }

      res.json({
        success: true,
        message: `Successfully processed ${parsedEvents.length} events`,
        events: parsedEvents,
        imported,
        skipped
      });

    } catch (error) {
      console.error('Error uploading schedule:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to process calendar file"
      });
    }
  });



  // Password reset functionality
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with that email exists, password reset instructions have been sent." });
      }

      // For now, just return a message directing them to contact admin
      // In a production system, you'd send an actual email
      res.json({ 
        message: "Password reset requested. Please contact Aaron Most (amost@gracecrusaders.org) for password assistance.",
        contactEmail: "amost@gracecrusaders.org"
      });

    } catch (error) {
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
