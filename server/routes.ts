import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertJobSchema, 
  insertApplicationSchema, 
  insertRatingSchema, 
  insertVerificationDocumentSchema,
  insertConversationSchema,
  insertMessageSchema,
  jobs,
  savedJobs,
  favoriteWorkers,
  notifications,
  blocks,
  reports,
  payments,
  verificationDocuments,
  messages,
  conversations
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { eq, like, ilike, and, or, ne, desc, sql, isNull } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { getChatbotResponse, getJobRecommendations, getHiringTips } from "./services/openai-service";

// Configure multer storage
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "verification");
const ALLOWED_DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const extension = file.mimetype === "image/jpeg" ? ".jpg" : file.mimetype === "image/png" ? ".png" : ".webp";
    cb(null, `${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_DOCUMENT_TYPES.has(file.mimetype)),
});

const validId = (value: string) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

const removeUpload = async (file?: Express.Multer.File) => {
  if (file) await fs.promises.unlink(file.path).catch(() => undefined);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  const requireUser = (req: Request, res: Response): req is Request & { user: Express.User } => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "Not authenticated" });
      return false;
    }
    return true;
  };

  const pageParams = (query: Record<string, unknown>) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    return { page, limit, offset: (page - 1) * limit };
  };
  
  // POST delete all users (be careful with this route!)
  // Destructive bulk deletion is intentionally not exposed through HTTP.
  
  // POST set UPI payment info (admin use)
  app.post("/api/payment/upi", (_req, res) => res.status(501).json({ message: "Payment configuration requires a verified payment provider" }));
  
  // POST process UPI payment
  app.post("/api/payment/process", (_req, res) => res.status(501).json({ message: "Payments are not authoritative until verified by a configured provider" }));

  app.get("/api/payments", async (req, res) => {
    if (!requireUser(req, res)) return;
    const { limit, offset } = pageParams(req.query);
    const history = await db.select().from(payments)
      .where(or(eq(payments.payerId, req.user.id), eq(payments.payeeId, req.user.id)))
      .orderBy(desc(payments.createdAt)).limit(limit).offset(offset);
    res.json(history);
  });

  // GET workers
  app.get("/api/workers", async (req, res) => {
    try {
      const skill = req.query.skill as string | undefined;
      let workers;
      
      if (skill) {
        workers = await storage.getWorkersBySkill(skill);
      } else {
        const topRated = req.query.topRated === "true";
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        
        if (topRated) {
          workers = await storage.getTopRatedWorkers(limit);
        } else {
          const workerUsers = await storage.getUsers("worker");
          const workerRecords = await Promise.all(workerUsers.map(async (user) => {
            const profile = await storage.getWorkerProfile(user.id);
            return profile ? { ...profile, user } : null;
          }));
          workers = workerRecords.filter((worker): worker is NonNullable<typeof worker> => worker !== null);
        }
      }
      res.json(workers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  // GET worker by ID
  app.get("/api/workers/:id(\\d+)", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid worker ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "worker") {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      const profile = await storage.getWorkerProfile(userId);
      const ratings = await storage.getRatingsByWorker(userId);
      
      res.json({ user, profile, ratings });
    } catch (error) {
      console.error("Error fetching worker:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch worker", error: errorMessage });
    }
  });

  // GET jobs with optional filters
  app.get("/api/jobs", async (req, res) => {
    try {
      const filters: {
        category?: string,
        location?: string,
        isActive?: boolean
      } = {};
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      if (req.query.location) {
        filters.location = req.query.location as string;
      }
      
      filters.isActive = req.query.isActive !== "false";
      
      const jobs = await storage.getJobs(filters);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // GET job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = validId(req.params.id);
      if (!jobId) return res.status(400).json({ message: "Invalid job ID" });
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Get applications for this job
      const applications = await storage.getApplicationsByJob(jobId);
      
      res.json({ job, applications });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // POST create job
  app.post("/api/jobs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Only employers can post jobs" });
      }
      
      const validatedData = insertJobSchema.parse({
        ...req.body,
        employerId: req.user.id,
      });
      
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // PATCH update job
  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (req.user.userType !== "employer" || job.employerId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own jobs" });
      }
      
      const update = z.object({
        title: z.string().trim().min(3).max(120).optional(),
        description: z.string().trim().min(10).max(5000).optional(),
        location: z.string().trim().min(2).max(120).optional(),
        category: z.string().trim().min(2).max(80).optional(),
        wage: z.string().trim().min(1).max(80).optional(),
        duration: z.string().trim().max(120).nullable().optional(),
        isActive: z.boolean().optional(),
      }).strict().parse(req.body);
      const updatedJob = await storage.updateJob(jobId, update);
      res.json(updatedJob);
    } catch (error) {
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // GET applications by worker
  app.get("/api/workers/:id/applications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const workerId = parseInt(req.params.id);
      
      if (!workerId || req.user.id !== workerId) {
        return res.status(403).json({ message: "You can only view your own applications" });
      }
      
      const applications = await storage.getApplicationsByWorker(workerId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // POST apply to job
  app.post("/api/jobs/:id/apply", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "worker") {
        return res.status(403).json({ message: "Only workers can apply for jobs" });
      }
      
      const jobId = validId(req.params.id);
      if (!jobId) return res.status(400).json({ message: "Invalid job ID" });
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (!job.isActive) {
        return res.status(400).json({ message: "This job is no longer active" });
      }
      
      // Check if already applied
      const applications = await storage.getApplicationsByWorker(req.user.id);
      const alreadyApplied = applications.some(app => app.jobId === jobId);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this job" });
      }
      
      const validatedData = insertApplicationSchema.parse({
        jobId,
        workerId: req.user.id,
      });
      
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to apply for job" });
    }
  });

  // PATCH update application status
  app.patch("/api/applications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const applicationId = validId(req.params.id);
      if (!applicationId) return res.status(400).json({ message: "Invalid application ID" });
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      const job = await storage.getJob(application.jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Only the employer who posted the job can update application status
      if (req.user.userType !== "employer" || job.employerId !== req.user.id) {
        return res.status(403).json({ message: "You can only update applications for your own jobs" });
      }
      
      const { status } = req.body;
      if (!["shortlisted", "accepted", "rejected", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const transitions: Record<string, string[]> = {
        pending: ["shortlisted", "accepted", "rejected"],
        shortlisted: ["accepted", "rejected"],
        accepted: ["completed"],
        rejected: [],
        completed: [],
      };
      if (!transitions[application.status].includes(status)) {
        return res.status(409).json({ message: "Invalid application status transition" });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // POST create rating
  app.post("/api/ratings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Only employers can rate workers" });
      }
      
      // Validate application completion
      const ratingInput = z.object({ workerId: z.number().int().positive(), jobId: z.number().int().positive() }).parse(req.body);
      const { workerId, jobId } = ratingInput;
      const job = await storage.getJob(jobId);
      if (!job || job.employerId !== req.user.id) return res.status(403).json({ message: "You can only rate workers for your own jobs" });
      const applications = await storage.getApplicationsByJob(jobId);
      const workerApplication = applications.find(app => app.worker.id === workerId);
      
      if (!workerApplication || workerApplication.status !== "completed") {
        return res.status(400).json({ message: "Cannot rate a worker for an incomplete job" });
      }
      
      const validatedData = insertRatingSchema.parse({
        ...req.body,
        employerId: req.user.id,
      });
      
      const rating = await storage.createRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // GET employer dashboard data
  app.get("/api/employers/dashboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Ensure we have a valid user ID (must be a number)
      const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(req.user.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log("Employer dashboard - authenticated user:", userId, req.user.username);
      
      const jobs = await storage.getJobsByEmployer(userId);
      console.log("Employer jobs found:", jobs.length);
      
      // Get applications for each job
      const jobsWithApplications = await Promise.all(jobs.map(async job => {
        const applications = await storage.getApplicationsByJob(job.id);
        return { ...job, applications };
      }));
      
      res.json({ jobs: jobsWithApplications });
    } catch (error) {
      console.error("Employer dashboard error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch dashboard data", error: errorMessage });
    }
  });

  // Simple worker profile test endpoint
  app.get("/api/workers/profile-test", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Just return basic info without any database calls
    return res.json({
      message: "Profile test endpoint is working",
      user: req.user
    });
  });

  // PATCH worker availability
  app.patch("/api/workers/profile/availability", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (req.user.userType !== "worker") {
        return res.status(403).json({ message: "Only workers can update availability" });
      }

      const { isAvailable } = req.body;
      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({ message: "isAvailable must be a boolean" });
      }

      const profile = await storage.updateWorkerProfile(req.user.id, { isAvailable });
      if (!profile) {
        return res.status(404).json({ message: "Worker profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Worker availability update error:", error);
      res.status(500).json({ message: "Failed to update worker availability" });
    }
  });

  // GET worker dashboard data
  app.get("/api/workers/dashboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const profile = await storage.getWorkerProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Worker profile not found" });
      }

      const applications = await storage.getApplicationsByWorker(req.user.id);
      const ratings = await storage.getRatingsByWorker(req.user.id);

      return res.json({
        profile,
        applications,
        ratings
      });
    } catch (error) {
      console.error("Worker dashboard error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch worker dashboard data", error: errorMessage });
    }
  });

  // POST submit verification
  app.post("/api/verification/submit", upload.single('document'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const verificationSchema = z.object({
        govtIdType: z.enum(["aadhar_card", "voter_id", "passport", "driving_license", "pan_card"], {
          error: "ID type is required"
        }),
        govtId: z.string().trim().min(4).max(64).regex(/^[A-Za-z0-9 -]+$/),
        dateOfBirth: z.string().date().transform(val => new Date(`${val}T00:00:00Z`)),
        address: z.string().trim().min(5).max(300),
      });
      
      // Validate the incoming data
      const data = verificationSchema.parse(req.body);
      
      // Calculate age from date of birth
      const dob = data.dateOfBirth;
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear() - 
        (today.getMonth() < dob.getMonth() || 
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
      
      // Check if age is at least 18
      if (age < 18) {
        return res.status(400).json({ message: "You must be at least 18 years old" });
      }
      
      // Verify document file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "ID document image is required" });
      }
      
      // Update user with verification status
      const updatedUser = await storage.updateUserVerification(
        req.user.id, 
        "pending"
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create verification document
      await storage.createVerificationDocument({
        userId: req.user.id,
        documentType: data.govtIdType,
        documentNumber: data.govtId,
        documentImageUrl: req.file.path,
      });
      
      res.status(201).json({ 
        message: "Verification submitted successfully",
        user: updatedUser
      });
    } catch (error) {
      await removeUpload(req.file);
      console.error("Verification submission error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid verification data", 
          errors: error.issues
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Failed to submit verification", 
        error: errorMessage 
      });
    }
  });

  // Verification files are deliberately not served from the public uploads directory.
  app.get("/api/verification/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const documentId = validId(req.params.id);
    if (!documentId) return res.status(400).json({ message: "Invalid document ID" });
    const [document] = req.user.userType === "admin"
      ? await db.select().from(verificationDocuments).where(eq(verificationDocuments.id, documentId)).limit(1)
      : (await storage.getVerificationDocuments(req.user.id)).filter((item) => item.id === documentId);
    if (!document?.documentImageUrl) return res.status(404).json({ message: "Document not found" });
    const filePath = path.resolve(document.documentImageUrl);
    if (!filePath.startsWith(`${UPLOAD_DIR}${path.sep}`)) return res.status(404).json({ message: "Document not found" });
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      res.setHeader("Cache-Control", "private, no-store");
      return res.sendFile(filePath);
    } catch {
      return res.status(404).json({ message: "Document not found" });
    }
  });

  // Chatbot API endpoint
  app.post("/api/chatbot/message", async (req, res) => {
    try {
      const parsed = z.object({ message: z.string().trim().min(1).max(2000) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Message is required and must be a string" 
        });
      }
      
      const response = await getChatbotResponse(parsed.data.message);
      
      return res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to process chatbot message",
        error: errorMessage
      });
    }
  });
  
  // Job recommendations API endpoint
  app.post("/api/chatbot/job-recommendations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "worker") {
        return res.status(403).json({ message: "Only workers can get job recommendations" });
      }
      
      const parsed = z.object({
        primarySkill: z.string().trim().min(2).max(100),
        location: z.string().trim().min(2).max(120),
        preferredJobTypes: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
      }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Primary skill and location are required" 
        });
      }
      
      const recommendations = await getJobRecommendations(parsed.data);
      
      return res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error("Job recommendations error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to get job recommendations",
        error: errorMessage
      });
    }
  });
  
  // Hiring tips API endpoint
  app.post("/api/chatbot/hiring-tips", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== "employer") {
        return res.status(403).json({ message: "Only employers can get hiring tips" });
      }
      
      const parsed = z.object({
        jobTitle: z.string().trim().min(2).max(120),
        requiredSkills: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
        location: z.string().trim().min(2).max(120),
      }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Job title, required skills, and location are required" 
        });
      }
      
      const tips = await getHiringTips(parsed.data);
      
      return res.json({
        success: true,
        tips
      });
    } catch (error) {
      console.error("Hiring tips error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: "Failed to get hiring tips",
        error: errorMessage
      });
    }
  });

  // Messaging API Routes
  
  // GET conversations for current user
  app.get("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversations = await storage.getConversationsByUser(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch conversations", error: errorMessage });
    }
  });

  // GET single conversation with messages
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant in this conversation
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this conversation" });
      }
      
      // Mark messages as read for this user
      await storage.markMessagesAsRead(conversationId, req.user.id);
      
      // Get the other participant
      const otherParticipantId = conversation.participant1Id === req.user.id 
        ? conversation.participant2Id 
        : conversation.participant1Id;
      
      const otherParticipant = await storage.getUser(otherParticipantId);
      
      // Get messages
      const messages = await storage.getMessagesByConversation(conversationId);
      
      res.json({
        conversation,
        otherParticipant,
        messages
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to fetch conversation", error: errorMessage });
    }
  });

  // POST start new conversation or get existing
  app.post("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const parsed = z.object({ participantId: z.number().int().positive(), jobId: z.number().int().positive().nullable().optional() }).strict().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Valid participant ID is required" });
      const { participantId, jobId } = parsed.data;
      if (participantId === req.user.id) return res.status(400).json({ message: "You cannot message yourself" });
      
      const participant = await storage.getUser(participantId);
      
      if (!participant) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if conversation already exists
      let conversation = await storage.getConversationByParticipants(req.user.id, participantId);
      
      if (!conversation) {
        // Create new conversation
        conversation = await storage.createConversation({
          participant1Id: req.user.id,
          participant2Id: participantId,
          jobId: jobId || null
        });
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create conversation", error: errorMessage });
    }
  });

  // POST send message
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant in this conversation
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this conversation" });
      }
      
      const parsed = z.object({ content: z.string().trim().min(1).max(2000) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const message = await storage.createMessage({
        conversationId,
        senderId: req.user.id,
        content: parsed.data.content,
        metadata: {}
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to send message", error: errorMessage });
    }
  });

  // PATCH mark messages as read
  app.patch("/api/conversations/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Check if user is a participant in this conversation
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "You don't have access to this conversation" });
      }
      
      await storage.markMessagesAsRead(conversationId, req.user.id);
      res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to mark messages as read", error: errorMessage });
    }
  });
  
  // Search users endpoint (used for messaging)
  app.get("/api/search/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const query = req.query.query as string;
      const userType = req.query.userType as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Perform search in the database using Drizzle ORM
      let conditions = [];
      
      // First condition: username or fullName contains the query string
      conditions.push(
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.fullName, `%${query}%`)
        )
      );
      
      // Second condition: exclude the current user
      conditions.push(
        ne(users.id, req.user.id)
      );
      
      // Optional third condition: filter by user type if provided
      if (userType === 'worker' || userType === 'employer') {
        conditions.push(
          eq(users.userType, userType)
        );
      }
      
      // Execute the query
      const foundUsers = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          location: users.location,
          userType: users.userType,
        })
        .from(users)
        .where(and(...conditions))
        .limit(10);
      
      res.json(foundUsers);
    } catch (error) {
      console.error("User search error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to search users", error: errorMessage });
    }
  });

  app.get("/api/saved-jobs", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "worker") return res.status(403).json({ message: "Workers only" });
    const { limit, offset } = pageParams(req.query);
    const rows = await db.select({ saved: savedJobs, job: jobs })
      .from(savedJobs).innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .where(eq(savedJobs.workerId, req.user.id))
      .orderBy(desc(savedJobs.createdAt)).limit(limit).offset(offset);
    res.json(rows.map(({ saved, job }) => ({ ...saved, job })));
  });

  app.post("/api/saved-jobs/:jobId", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "worker") return res.status(403).json({ message: "Workers only" });
    const jobId = validId(req.params.jobId);
    if (!jobId) return res.status(400).json({ message: "Invalid job ID" });
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job || !job.isActive || (job.expiresAt && job.expiresAt <= new Date())) {
      return res.status(404).json({ message: "Active job not found" });
    }
    const [saved] = await db.insert(savedJobs).values({ workerId: req.user.id, jobId })
      .onConflictDoNothing().returning();
    res.status(saved ? 201 : 200).json(saved ?? { workerId: req.user.id, jobId });
  });

  app.delete("/api/saved-jobs/:jobId", async (req, res) => {
    if (!requireUser(req, res)) return;
    const jobId = validId(req.params.jobId);
    if (!jobId) return res.status(400).json({ message: "Invalid job ID" });
    await db.delete(savedJobs).where(and(eq(savedJobs.workerId, req.user.id), eq(savedJobs.jobId, jobId)));
    res.sendStatus(204);
  });

  app.get("/api/favorite-workers", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "employer") return res.status(403).json({ message: "Employers only" });
    const { limit, offset } = pageParams(req.query);
    const rows = await db.select({
      favorite: favoriteWorkers,
      worker: { id: users.id, username: users.username, fullName: users.fullName, location: users.location, isVerified: users.isVerified },
    }).from(favoriteWorkers).innerJoin(users, eq(favoriteWorkers.workerId, users.id))
      .where(eq(favoriteWorkers.employerId, req.user.id))
      .orderBy(desc(favoriteWorkers.createdAt)).limit(limit).offset(offset);
    res.json(rows.map(({ favorite, worker }) => ({ ...favorite, worker })));
  });

  app.post("/api/favorite-workers/:workerId", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "employer") return res.status(403).json({ message: "Employers only" });
    const workerId = validId(req.params.workerId);
    if (!workerId) return res.status(400).json({ message: "Invalid worker ID" });
    const [worker] = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.id, workerId), eq(users.userType, "worker"))).limit(1);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    const [favorite] = await db.insert(favoriteWorkers).values({ employerId: req.user.id, workerId })
      .onConflictDoNothing().returning();
    res.status(favorite ? 201 : 200).json(favorite ?? { employerId: req.user.id, workerId });
  });

  app.delete("/api/favorite-workers/:workerId", async (req, res) => {
    if (!requireUser(req, res)) return;
    const workerId = validId(req.params.workerId);
    if (!workerId) return res.status(400).json({ message: "Invalid worker ID" });
    await db.delete(favoriteWorkers).where(and(eq(favoriteWorkers.employerId, req.user.id), eq(favoriteWorkers.workerId, workerId)));
    res.sendStatus(204);
  });

  app.get("/api/notifications", async (req, res) => {
    if (!requireUser(req, res)) return;
    const { limit, offset } = pageParams(req.query);
    const items = await db.select().from(notifications).where(eq(notifications.userId, req.user.id))
      .orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
    const [{ unread }] = await db.select({ unread: sql<number>`count(*)::int` }).from(notifications)
      .where(and(eq(notifications.userId, req.user.id), sql`${notifications.readAt} is null`));
    res.json({ items, unread });
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!requireUser(req, res)) return;
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid notification ID" });
    const [updated] = await db.update(notifications).set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.user.id))).returning();
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  });

  app.get("/api/messages/unread-count", async (req, res) => {
    if (!requireUser(req, res)) return;
    const result = await db.execute(sql`
      select count(*)::int as count
      from ${messages}
      join ${conversations} on ${messages.conversationId} = ${conversations.id}
      where (${conversations.participant1Id} = ${req.user.id} or ${conversations.participant2Id} = ${req.user.id})
        and ${messages.senderId} <> ${req.user.id}
        and ${messages.readAt} is null
    `);
    res.json({ count: Number(result.rows[0]?.count ?? 0) });
  });

  app.post("/api/blocks/:userId", async (req, res) => {
    if (!requireUser(req, res)) return;
    const blockedId = validId(req.params.userId);
    if (!blockedId || blockedId === req.user.id) return res.status(400).json({ message: "Invalid user ID" });
    const [blocked] = await db.insert(blocks).values({ blockerId: req.user.id, blockedId })
      .onConflictDoNothing().returning();
    res.status(blocked ? 201 : 200).json(blocked ?? { blockerId: req.user.id, blockedId });
  });

  app.delete("/api/blocks/:userId", async (req, res) => {
    if (!requireUser(req, res)) return;
    const blockedId = validId(req.params.userId);
    if (!blockedId) return res.status(400).json({ message: "Invalid user ID" });
    await db.delete(blocks).where(and(eq(blocks.blockerId, req.user.id), eq(blocks.blockedId, blockedId)));
    res.sendStatus(204);
  });

  app.post("/api/reports", async (req, res) => {
    if (!requireUser(req, res)) return;
    const payload = z.object({
      targetUserId: z.number().int().positive().optional(),
      jobId: z.number().int().positive().optional(),
      reason: z.string().trim().min(3).max(120),
      details: z.string().trim().max(2000).optional(),
    }).refine((value) => value.targetUserId || value.jobId, { message: "A user or job is required" }).parse(req.body);
    const [report] = await db.insert(reports).values({ reporterId: req.user.id, ...payload }).returning();
    res.status(201).json(report);
  });

  app.get("/api/admin/overview", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "admin") return res.status(403).json({ message: "Admins only" });
    const [[userCount], [jobCount], [openReportCount]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(jobs),
      db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "open")),
    ]);
    res.json({ users: userCount.count, jobs: jobCount.count, openReports: openReportCount.count });
  });

  app.get("/api/admin/reports", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "admin") return res.status(403).json({ message: "Admins only" });
    const { limit, offset } = pageParams(req.query);
    res.json(await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(limit).offset(offset));
  });

  app.get("/api/admin/verifications", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "admin") return res.status(403).json({ message: "Admins only" });
    const { limit, offset } = pageParams(req.query);
    const rows = await db.select({
      id: verificationDocuments.id,
      userId: verificationDocuments.userId,
      documentType: verificationDocuments.documentType,
      submittedAt: verificationDocuments.submittedAt,
      reviewedAt: verificationDocuments.reviewedAt,
      verificationNotes: verificationDocuments.verificationNotes,
      status: users.verificationStatus,
    }).from(verificationDocuments)
      .innerJoin(users, eq(users.id, verificationDocuments.userId))
      .orderBy(desc(verificationDocuments.submittedAt)).limit(limit).offset(offset);
    res.json(rows);
  });

  app.patch("/api/admin/verifications/:id", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "admin") return res.status(403).json({ message: "Admins only" });
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid verification ID" });
    const payload = z.object({
      status: z.enum(["verified", "rejected"]),
      notes: z.string().trim().max(1000).optional(),
    }).parse(req.body);
    const reviewerId = req.user.id;
    const updated = await db.transaction(async (tx) => {
      const reviewedAt = new Date();
      const [document] = await tx.update(verificationDocuments).set({
        verificationNotes: payload.notes ?? null,
        reviewedAt,
        reviewedById: reviewerId,
      }).where(and(eq(verificationDocuments.id, id), isNull(verificationDocuments.reviewedAt))).returning();
      if (!document) return null;
      await tx.update(users).set({
        verificationStatus: payload.status,
        isVerified: payload.status === "verified",
      }).where(eq(users.id, document.userId));
      return document;
    });
    if (!updated) return res.status(409).json({ message: "Verification was already reviewed or does not exist" });
    res.json(updated);
  });

  app.patch("/api/admin/reports/:id", async (req, res) => {
    if (!requireUser(req, res)) return;
    if (req.user.userType !== "admin") return res.status(403).json({ message: "Admins only" });
    const id = validId(req.params.id);
    const { status } = z.object({ status: z.enum(["reviewing", "resolved", "dismissed"]) }).parse(req.body);
    if (!id) return res.status(400).json({ message: "Invalid report ID" });
    const [updated] = await db.update(reports).set({ status, reviewedAt: new Date() }).where(eq(reports.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Report not found" });
    res.json(updated);
  });

  app.patch("/api/settings/marketplace", async (req, res) => {
    if (!requireUser(req, res)) return;
    const payload = z.object({
      locationVisible: z.boolean().optional(),
      isHiring: z.boolean().optional(),
    }).parse(req.body);
    if (req.user.userType !== "employer" && payload.isHiring !== undefined) {
      return res.status(403).json({ message: "Only employers can set hiring status" });
    }
    const [updated] = await db.update(users).set(payload).where(eq(users.id, req.user.id)).returning();
    res.json(updated);
  });

  const httpServer = createServer(app);
  return httpServer;
}
