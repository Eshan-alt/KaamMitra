import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table that can be either a worker or an employer
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  userType: text("user_type", { enum: ["worker", "employer", "admin"] }).notNull(),
  location: text("location").notNull(),
  locationVisible: boolean("location_visible").default(true).notNull(),
  isHiring: boolean("is_hiring").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Verification fields
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  isVerified: boolean("is_verified").default(false),
  // Use varchar instead of text for enum to prevent type conversion issues
  verificationStatus: text("verification_status", { 
    enum: ["not_submitted", "pending", "verified", "rejected"] 
  }).default("not_submitted").notNull(),
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
}, (table) => [
  index("users_type_idx").on(table.userType),
  index("users_email_idx").on(table.email),
]);

// Worker profiles with skills and ratings
export const workerProfiles = pgTable("worker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  primarySkill: text("primary_skill").notNull(),
  description: text("description"),
  isAvailable: boolean("is_available").default(true).notNull(),
  averageRating: integer("average_rating").default(0).notNull(),
  totalRatings: integer("total_ratings").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
}, (table) => [uniqueIndex("worker_profiles_user_id_unique").on(table.userId)]);

// Job postings by employers
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  wage: text("wage").notNull(),
  duration: text("duration"),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("jobs_active_location_idx").on(table.isActive, table.location), index("jobs_employer_idx").on(table.employerId)]);

// Job applications from workers to jobs
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  workerId: integer("worker_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "shortlisted", "accepted", "rejected", "completed"] }).default("pending").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("applications_job_worker_unique").on(table.jobId, table.workerId), index("applications_worker_idx").on(table.workerId)]);

// Ratings given to workers after job completion
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => users.id),
  employerId: integer("employer_id").notNull().references(() => users.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("ratings_job_worker_unique").on(table.jobId, table.workerId), check("ratings_range_check", sql`${table.rating} between 1 and 5`)]);

// Government ID verification documents
export const verificationDocuments = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type", { 
    enum: ["aadhar_card", "voter_id", "passport", "driving_license", "pan_card", "other"] 
  }).notNull(),
  documentNumber: text("document_number").notNull(),
  documentImageUrl: text("document_image_url"), // URL or reference to where the document is stored
  verificationNotes: text("verification_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: integer("reviewed_by_id").references(() => users.id),
}, (table) => [index("verification_documents_user_idx").on(table.userId)]);

// Chat conversations between users
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").notNull().references(() => users.id),
  participant2Id: integer("participant2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Optional relation to job if conversation is about a specific job
  jobId: integer("job_id").references(() => jobs.id),
}, (table) => [index("conversations_participant_1_idx").on(table.participant1Id), index("conversations_participant_2_idx").on(table.participant2Id)]);

// Chat messages in conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
  // For additional features like attachments, we can use jsonb
  metadata: jsonb("metadata"),
}, (table) => [index("messages_conversation_sent_idx").on(table.conversationId, table.sentAt)]);

export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("saved_jobs_worker_job_unique").on(table.workerId, table.jobId),
  index("saved_jobs_worker_idx").on(table.workerId),
]);

export const favoriteWorkers = pgTable("favorite_workers", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("favorite_workers_employer_worker_unique").on(table.employerId, table.workerId),
  index("favorite_workers_employer_idx").on(table.employerId),
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("notifications_user_created_idx").on(table.userId, table.createdAt)]);

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: integer("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("blocks_pair_unique").on(table.blockerId, table.blockedId)]);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status", { enum: ["open", "reviewing", "resolved", "dismissed"] }).default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [index("reports_status_created_idx").on(table.status, table.createdAt)]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  payerId: integer("payer_id").notNull().references(() => users.id),
  payeeId: integer("payee_id").notNull().references(() => users.id),
  jobId: integer("job_id").references(() => jobs.id),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").default("INR").notNull(),
  status: text("status", { enum: ["pending", "succeeded", "failed", "cancelled", "refunded"] }).default("pending").notNull(),
  provider: text("provider").notNull(),
  providerReference: text("provider_reference").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("payments_payer_created_idx").on(table.payerId, table.createdAt),
  index("payments_payee_created_idx").on(table.payeeId, table.createdAt),
  check("payments_amount_positive_check", sql`${table.amountCents} > 0`),
]);

// Managed by connect-pg-simple; modeled here so Drizzle never mistakes it for
// a renamed application table during non-interactive schema pushes.
export const sessionTable = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);

export const authRateLimits = pgTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").default(1).notNull(),
  resetAt: timestamp("reset_at").notNull(),
}, (table) => [index("auth_rate_limits_reset_idx").on(table.resetAt)]);

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verificationStatus: true,
  emailVerified: true,
  verificationCode: true,
  verificationCodeExpires: true,
}).extend({
  username: z.string().trim().toLowerCase().min(3).max(32).regex(/^[a-z0-9_]+$/),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  email: z.string().trim().toLowerCase().email().max(254),
  location: z.string().trim().min(2).max(120),
  userType: z.enum(["worker", "employer"]),
});

export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({
  id: true,
  averageRating: true,
  totalRatings: true,
  verified: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  isActive: true,
}).extend({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  location: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  wage: z.string().trim().min(1).max(80),
  duration: z.string().trim().max(120).nullable().optional(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true, 
  status: true,
  appliedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).nullable().optional(),
});

export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedById: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  readAt: true,
}).extend({
  content: z.string().trim().min(1).max(2000),
  metadata: z.record(z.string(), z.string().max(256)).optional(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SavedJob = typeof savedJobs.$inferSelect;
export type FavoriteWorker = typeof favoriteWorkers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Payment = typeof payments.$inferSelect;
