import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { storage } from "./storage";
import { insertContactSchema, insertSchoolSchema, insertSportSchema, insertGameSchema, insertStandingSchema, insertNewsSchema, insertUserSchema, insertGameResultSubmissionSchema, insertNewsUpdatedSchema } from "@shared/schema";
import { ICalParser } from "./ical-parser";

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
      const game = await storage.createGame(validatedData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
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
      if (!user || user.password !== password) { // In production, use proper password hashing
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // In production, create JWT token here
      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId },
        message: "Login successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
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

          await storage.createGame(gameData);
          imported++;

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

  const httpServer = createServer(app);
  return httpServer;
}
