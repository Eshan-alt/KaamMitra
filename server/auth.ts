import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, type RequestHandler } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { insertUserSchema } from "@shared/schema";
import { sendVerificationEmail, verifyEmail } from "./email-service";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

function rateLimit(windowMs: number, max: number, scope: (req: Parameters<RequestHandler>[0]) => string): RequestHandler {
  return async (req, res, next) => {
    try {
      const key = scope(req);
      const resetAt = new Date(Date.now() + windowMs);
      const result = await db.execute(sql`
        INSERT INTO auth_rate_limits ("key", "count", "reset_at")
        VALUES (${key}, 1, ${resetAt})
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE WHEN auth_rate_limits.reset_at <= now() THEN 1 ELSE auth_rate_limits.count + 1 END,
          "reset_at" = CASE WHEN auth_rate_limits.reset_at <= now() THEN ${resetAt} ELSE auth_rate_limits.reset_at END
        RETURNING "count", "reset_at"
      `);
      const row = result.rows[0] as { count: number; reset_at: Date };
      if (Number(row.count) > max) {
        const retryAt = new Date(row.reset_at).getTime();
        res.setHeader("Retry-After", Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)));
        return res.status(429).json({ message: "Too many attempts. Please try again later." });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt || !/^[a-f0-9]{128}$/i.test(hashed) || !/^[a-f0-9]{32}$/i.test(salt)) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return hashedBuf.length === suppliedBuf.length && timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters");
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
        if (!normalizedUsername || typeof password !== "string" || password.length > 128) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        const user = await storage.getUserByUsername(normalizedUsername);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: unknown, done) => {
    try {
      const userId = typeof id === "number" ? id : Number(id);
      if (!Number.isSafeInteger(userId) || userId < 1) {
        return done(new Error("Invalid user ID"));
      }
      const user = await storage.getUser(userId);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  const byIp = (req: Parameters<RequestHandler>[0]) => req.ip || req.socket.remoteAddress || "unknown";
  const authLimit = rateLimit(15 * 60_000, 10, byIp);
  const registrationLimit = rateLimit(60 * 60_000, 5, byIp);
  const verificationLimit = rateLimit(15 * 60_000, 8, (req) => `${byIp(req)}:${req.user?.id ?? "anonymous"}`);
  const resendLimit = rateLimit(60 * 60_000, 3, (req) => `${byIp(req)}:${req.user?.id ?? "anonymous"}`);

  app.post("/api/register", registrationLimit, async (req, res, next) => {
    try {
      const registrationSchema = insertUserSchema.extend({
        primarySkill: z.string().trim().min(2).max(100).optional(),
        description: z.string().trim().max(1000).optional(),
      }).superRefine((value, ctx) => {
        if (value.userType === "worker" && !value.primarySkill) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["primarySkill"], message: "Primary skill is required for workers" });
        }
      });
      const payload = registrationSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(payload.username);

      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      if (await storage.getUserByEmail(payload.email)) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...payload,
        password: await hashPassword(payload.password),
      });

      // Create worker profile if userType is worker
      if (user.userType === "worker" && payload.primarySkill) {
        await storage.createWorkerProfile({
          userId: user.id,
          primarySkill: req.body.primarySkill,
          description: payload.description || "",
          isAvailable: true
        });
      }
      
      // Send verification email
      try {
        const emailSent = await sendVerificationEmail(user);
        if (emailSent) {
          console.log("Verification email sent successfully to:", user.email);
        } else {
          console.warn("Failed to send verification email to:", user.email);
        }
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Continue the registration process even if email sending fails
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const userWithoutPassword = publicUser(user);
        res.status(201).json({
          ...userWithoutPassword,
          message: "Registration successful. Please check your email for a verification code."
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid registration data", errors: error.issues });
      next(error);
    }
  });

  app.post("/api/login", authLimit, (req, res, next) => {
    const input = z.object({ username: z.string().trim().toLowerCase().min(3).max(32), password: z.string().min(1).max(128) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ message: "Invalid login data" });
    req.body.username = input.data.username;
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info?: { message?: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        return res.status(200).json(publicUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json(null);
    }
    
    // Return user without password
    res.json(publicUser(req.user));
  });
  
  // Email verification endpoint
  app.post("/api/verify-email", verificationLimit, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const { code } = z.object({ code: z.string().regex(/^\d{6}$/) }).parse(req.body);
      const isVerified = await verifyEmail(req.user.id, code);
      
      if (isVerified) {
        return res.status(200).json({ 
          success: true, 
          message: "Email verified successfully" 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired verification code" 
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Resend verification email endpoint
  app.post("/api/resend-verification", resendLimit, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.user;
      
      // Don't resend if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }
      
      const emailSent = await sendVerificationEmail(user);
      
      if (emailSent) {
        return res.status(200).json({ 
          success: true, 
          message: "Verification email sent successfully" 
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send verification email" 
        });
      }
    } catch (error) {
      next(error);
    }
  });
}

function publicUser(user: SelectUser) {
  const { password: _password, verificationCode: _code, verificationCodeExpires: _expires, ...safeUser } = user;
  return safeUser;
}
