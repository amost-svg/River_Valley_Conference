import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import session from "express-session";
import { storage } from "../storage";

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials not provided. Google authentication will not be available.");
}

export function setupGoogleAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id.toString());
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error, false);
    }
  });

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), false);
        }

        // Check if user exists in our system
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // For security, we only allow existing users to login via Google
          // They must be pre-created by the super admin
          return done(new Error("User not found in system. Please contact administrator."), false);
        }

        if (!user.isActive) {
          return done(new Error("Account is deactivated"), false);
        }

        // Update user's Google info if changed
        if (user.name !== profile.displayName && profile.displayName) {
          await storage.updateUser(user.id, {
            name: profile.displayName,
            // Store Google profile info
            googleId: profile.id,
            profileImageUrl: profile.photos?.[0]?.value
          });
        }

        // Update last login
        await storage.updateLastLogin(user.id);

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login?error=auth_failed" }),
    (req, res) => {
      // Successful authentication, redirect to admin dashboard
      res.redirect("/admin");
    }
  );

  // Regular login route (existing email/password)
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

      // Create session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
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
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Check authentication status
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        isSuperAdmin: user.isSuperAdmin
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Middleware to check if user is super admin
export function requireSuperAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isSuperAdmin) {
    return next();
  }
  res.status(403).json({ message: "Super admin access required" });
}