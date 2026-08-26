import { users, type User, type InsertUser } from "@shared/schema";
import { workerProfiles, type WorkerProfile, type InsertWorkerProfile } from "@shared/schema";
import { jobs, type Job, type InsertJob } from "@shared/schema";
import { applications, type Application, type InsertApplication } from "@shared/schema";
import { ratings, type Rating, type InsertRating } from "@shared/schema";
import { verificationDocuments, type VerificationDocument, type InsertVerificationDocument } from "@shared/schema";
import { conversations, type Conversation, type InsertConversation } from "@shared/schema";
import { messages, type Message, type InsertMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, desc, and, like, sql, or, not, isNull } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(userType?: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(id: number, verificationStatus: "not_submitted" | "pending" | "verified" | "rejected"): Promise<User | undefined>;
  updateUserVerificationCode(userId: number, code: string, expires: Date): Promise<User | undefined>;
  updateUserEmailVerification(userId: number, verified: boolean): Promise<User | undefined>;
  deleteAllUsers(): Promise<void>;
  
  // Worker profile operations
  getWorkerProfile(userId: number): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;
  updateWorkerProfile(userId: number, profile: Partial<WorkerProfile>): Promise<WorkerProfile | undefined>;
  getWorkersBySkill(skill: string): Promise<(WorkerProfile & { user: User })[]>;
  getTopRatedWorkers(limit?: number): Promise<(WorkerProfile & { user: User })[]>;
  
  // Job operations
  getJob(id: number): Promise<(Job & { employer: User }) | undefined>;
  getJobs(filters?: {category?: string, location?: string, isActive?: boolean}): Promise<(Job & { employer: User })[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByWorker(workerId: number): Promise<(Application & { job: Job })[]>;
  getApplicationsByJob(jobId: number): Promise<(Application & { worker: User })[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: "pending" | "shortlisted" | "accepted" | "rejected" | "completed"): Promise<Application | undefined>;
  
  // Rating operations
  getRatingsByWorker(workerId: number): Promise<Rating[]>;
  createRating(rating: InsertRating): Promise<Rating>;
  
  // Verification operations
  getVerificationDocuments(userId: number): Promise<VerificationDocument[]>;
  createVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument>;
  updateVerificationDocument(id: number, reviewNotes?: string, reviewedAt?: Date): Promise<VerificationDocument | undefined>;
  
  // Messaging operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationByParticipants(participant1Id: number, participant2Id: number): Promise<Conversation | undefined>;
  getConversationsByUser(userId: number): Promise<(Conversation & { otherParticipant: User, lastMessage?: Message })[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationLastMessage(id: number, lastMessageAt?: Date): Promise<Conversation | undefined>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  
  // Session store for authentication
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workerProfiles: Map<number, WorkerProfile>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private ratings: Map<number, Rating>;
  public sessionStore: any;
  private userIdCounter: number;
  private profileIdCounter: number;
  private jobIdCounter: number;
  private applicationIdCounter: number;
  private ratingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workerProfiles = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.ratings = new Map();
    this.userIdCounter = 1;
    this.profileIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.ratingIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  async getUsers(userType?: string): Promise<User[]> {
    if (userType) {
      return Array.from(this.users.values()).filter(user => user.userType === userType);
    }
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt, locationVisible: insertUser.locationVisible ?? true, isHiring: insertUser.isHiring ?? false, dateOfBirth: null, age: null, isVerified: false, verificationStatus: "not_submitted", emailVerified: false, verificationCode: null, verificationCodeExpires: null };
    this.users.set(id, user);
    return user;
  }

  async updateUserVerification(id: number, verificationStatus: "not_submitted" | "pending" | "verified" | "rejected"): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const isVerified = verificationStatus === "verified";
    const updatedUser = { ...user, verificationStatus, isVerified };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserVerificationCode(userId: number, code: string, expires: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      verificationCode: code,
      verificationCodeExpires: expires 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserEmailVerification(userId: number, verified: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, emailVerified: verified };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async deleteAllUsers(): Promise<void> {
    this.users.clear();
    this.workerProfiles.clear();
    this.jobs.clear();
    this.applications.clear();
    this.ratings.clear();
    this.userIdCounter = 1;
    this.profileIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.ratingIdCounter = 1;
    console.log("All user data has been deleted from in-memory storage");
  }

  // Worker profile operations
  async getWorkerProfile(userId: number): Promise<WorkerProfile | undefined> {
    return Array.from(this.workerProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const id = this.profileIdCounter++;
    const workerProfile: WorkerProfile = { 
      ...profile, 
      id, 
      averageRating: 0, 
      totalRatings: 0,
      verified: false,
      description: profile.description ?? null,
      isAvailable: profile.isAvailable ?? true,
    };
    this.workerProfiles.set(id, workerProfile);
    return workerProfile;
  }

  async updateWorkerProfile(userId: number, update: Partial<WorkerProfile>): Promise<WorkerProfile | undefined> {
    const profile = await this.getWorkerProfile(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...update };
    this.workerProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  async getWorkersBySkill(skill: string): Promise<(WorkerProfile & { user: User })[]> {
    const workers = Array.from(this.workerProfiles.values())
      .filter(profile => profile.primarySkill === skill);
    
    return Promise.all(workers.map(async profile => {
      const user = await this.getUser(profile.userId);
      return { ...profile, user: user! };
    }));
  }

  async getTopRatedWorkers(limit: number = 4): Promise<(WorkerProfile & { user: User })[]> {
    const workers = Array.from(this.workerProfiles.values())
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
    
    return Promise.all(workers.map(async profile => {
      const user = await this.getUser(profile.userId);
      return { ...profile, user: user! };
    }));
  }

  // Job operations
  async getJob(id: number): Promise<(Job & { employer: User }) | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const employer = await this.getUser(job.employerId);
    if (!employer) return undefined;
    
    return { ...job, employer };
  }

  async getJobs(filters?: {category?: string, location?: string, isActive?: boolean}): Promise<(Job & { employer: User })[]> {
    let jobs = Array.from(this.jobs.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.category) {
        jobs = jobs.filter(job => job.category === filters.category);
      }
      if (filters.location) {
        jobs = jobs.filter(job => job.location.toLowerCase().includes(filters.location!.toLowerCase()));
      }
      if (filters.isActive !== undefined) {
        jobs = jobs.filter(job => job.isActive === filters.isActive);
      }
    }
    
    // Sort by most recent
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Fetch employer data for each job
    return Promise.all(jobs.map(async job => {
      const employer = await this.getUser(job.employerId);
      return { ...job, employer: employer! };
    }));
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const createdAt = new Date();
    const job: Job = { ...insertJob, id, createdAt, isActive: true, duration: insertJob.duration ?? null, expiresAt: insertJob.expiresAt ?? null };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, update: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...update };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.employerId === employerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByWorker(workerId: number): Promise<(Application & { job: Job })[]> {
    const applications = Array.from(this.applications.values())
      .filter(app => app.workerId === workerId);
    
    return Promise.all(applications.map(async app => {
      const job = this.jobs.get(app.jobId);
      return { ...app, job: job! };
    }));
  }

  async getApplicationsByJob(jobId: number): Promise<(Application & { worker: User })[]> {
    const applications = Array.from(this.applications.values())
      .filter(app => app.jobId === jobId);
    
    return Promise.all(applications.map(async app => {
      const worker = await this.getUser(app.workerId);
      return { ...app, worker: worker! };
    }));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const appliedAt = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      status: "pending", 
      appliedAt 
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplicationStatus(id: number, status: "pending" | "shortlisted" | "accepted" | "rejected" | "completed"): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Rating operations
  async getRatingsByWorker(workerId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values())
      .filter(rating => rating.workerId === workerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = this.ratingIdCounter++;
    const createdAt = new Date();
    const rating: Rating = { ...insertRating, id, createdAt, comment: insertRating.comment ?? null };
    this.ratings.set(id, rating);
    
    // Update worker profile average rating
    const workerProfile = await this.getWorkerProfile(rating.workerId);
    if (workerProfile) {
      const ratings = await this.getRatingsByWorker(rating.workerId);
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = Math.round(totalRating / ratings.length);
      
      await this.updateWorkerProfile(rating.workerId, {
        averageRating,
        totalRatings: ratings.length
      });
    }
    
    return rating;
  }

  // Verification document operations
  async getVerificationDocuments(userId: number): Promise<VerificationDocument[]> {
    // In-memory implementation would need to store verification documents
    // This is just a placeholder implementation
    return [];
  }
  
  async createVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument> {
    // In-memory implementation would need to store verification documents
    // This is just a placeholder implementation
    const now = new Date();
    return {
      id: 1,
      userId: document.userId,
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      documentImageUrl: document.documentImageUrl ?? null,
      verificationNotes: "",
      submittedAt: now,
      reviewedAt: null,
      reviewedById: null,
    };
  }
  
  async updateVerificationDocument(id: number, reviewNotes?: string, reviewedAt?: Date): Promise<VerificationDocument | undefined> {
    // In-memory implementation would need to store verification documents
    // This is just a placeholder implementation
    return undefined;
  }

  // Messaging operations - Conversations
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();
  private conversationIdCounter: number = 1;
  private messageIdCounter: number = 1;

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByParticipants(participant1Id: number, participant2Id: number): Promise<Conversation | undefined> {
    // Find a conversation where these two users are participants, regardless of order
    return Array.from(this.conversations.values()).find(
      (conv) => 
        (conv.participant1Id === participant1Id && conv.participant2Id === participant2Id) || 
        (conv.participant1Id === participant2Id && conv.participant2Id === participant1Id)
    );
  }

  async getConversationsByUser(userId: number): Promise<(Conversation & { otherParticipant: User, lastMessage?: Message })[]> {
    // Find all conversations where this user is a participant
    const userConversations = Array.from(this.conversations.values())
      .filter((conv) => conv.participant1Id === userId || conv.participant2Id === userId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    
    // Fetch other participant and optional last message for each conversation
    return Promise.all(userConversations.map(async (conv) => {
      const otherParticipantId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const otherParticipant = await this.getUser(otherParticipantId);
      
      // Get last message
      const messages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      
      const lastMessage = messages.length > 0 ? messages[0] : undefined;
      
      return { 
        ...conv, 
        otherParticipant: otherParticipant!, 
        lastMessage 
      };
    }));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();
    const newConversation: Conversation = { 
      ...conversation, jobId: conversation.jobId ?? null,
      id, 
      lastMessageAt: now, 
      createdAt: now 
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async updateConversationLastMessage(id: number, lastMessageAt: Date = new Date()): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation = { ...conversation, lastMessageAt };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime()); // Sort from oldest to newest
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const sentAt = new Date();
    const newMessage: Message = { 
      ...message, metadata: message.metadata ?? {},
      id, 
      sentAt, 
      readAt: null 
    };
    this.messages.set(id, newMessage);
    
    // Update conversation's last message timestamp
    await this.updateConversationLastMessage(message.conversationId, sentAt);
    
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    const now = new Date();
    
    // Find all unread messages in this conversation sent to this user
    const messagesToUpdate = Array.from(this.messages.values())
      .filter(msg => 
        msg.conversationId === conversationId && 
        msg.senderId !== userId && // Not sent by this user
        msg.readAt === null // Not already read
      );
      
    // Mark them as read
    for (const msg of messagesToUpdate) {
      const updatedMsg = { ...msg, readAt: now };
      this.messages.set(msg.id, updatedMsg);
    }
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Use raw SQL to handle schema evolution more gracefully
      const result = await db.execute(sql`
        SELECT 
          id, username, password, full_name as "fullName",
          phone, email, user_type as "userType", location,
          created_at as "createdAt", 
          date_of_birth as "dateOfBirth",
          age, is_verified as "isVerified",
          verification_status as "verificationStatus",
          email_verified as "emailVerified",
          verification_code as "verificationCode",
          verification_code_expires as "verificationCodeExpires"
        FROM users
        WHERE id = ${id}
      `);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error in getUser:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Use raw SQL to handle schema evolution more gracefully
      const result = await db.execute(sql`
        SELECT 
          id, username, password, full_name as "fullName",
          phone, email, user_type as "userType", location,
          created_at as "createdAt", 
          date_of_birth as "dateOfBirth",
          age, is_verified as "isVerified",
          verification_status as "verificationStatus",
          email_verified as "emailVerified",
          verification_code as "verificationCode",
          verification_code_expires as "verificationCodeExpires"
        FROM users
        WHERE username = ${username}
      `);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUsers(userType?: string): Promise<User[]> {
    try {
      if (userType) {
        return await db.select({
          id: users.id,
          username: users.username,
          password: users.password,
          fullName: users.fullName,
          phone: users.phone,
          email: users.email,
          userType: users.userType,
          location: users.location,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.userType, userType as "worker" | "employer")) as unknown as User[];
      }
      
      return await db.select({
        id: users.id,
        username: users.username,
        password: users.password,
        fullName: users.fullName,
        phone: users.phone,
        email: users.email,
        userType: users.userType,
        location: users.location,
        createdAt: users.createdAt
      })
      .from(users) as unknown as User[];
    } catch (error) {
      console.error("Error in getUsers:", error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Use simple query to avoid column mismatch issues with schema changes
      const result = await db.execute(sql`
        INSERT INTO users (
          username, password, full_name, phone, email, user_type, 
          location, verification_status
        ) VALUES (
          ${user.username}, 
          ${user.password}, 
          ${user.fullName}, 
          ${user.phone}, 
          ${user.email || null}, 
          ${user.userType}, 
          ${user.location}, 
          'not_submitted'
        ) RETURNING 
          id, username, password, full_name as "fullName", 
          phone, email, user_type as "userType", location, 
          created_at as "createdAt", date_of_birth as "dateOfBirth",
          age, is_verified as "isVerified",
          verification_status as "verificationStatus",
          email_verified as "emailVerified",
          verification_code as "verificationCode",
          verification_code_expires as "verificationCodeExpires"
      `);
      
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  // Worker profile operations
  async getWorkerProfile(userId: number): Promise<WorkerProfile | undefined> {
    try {
      const result = await db.select().from(workerProfiles).where(eq(workerProfiles.userId, userId));
      return result[0];
    } catch (error) {
      console.error("Error in getWorkerProfile:", error);
      throw error;
    }
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const result = await db.insert(workerProfiles).values({
      ...profile,
      averageRating: 0,
      totalRatings: 0,
      verified: false
    }).returning();
    return result[0];
  }

  async updateWorkerProfile(userId: number, update: Partial<WorkerProfile>): Promise<WorkerProfile | undefined> {
    const profile = await this.getWorkerProfile(userId);
    if (!profile) return undefined;
    
    const result = await db.update(workerProfiles)
      .set(update)
      .where(eq(workerProfiles.userId, userId))
      .returning();
    
    return result[0];
  }

  async getWorkersBySkill(skill: string): Promise<(WorkerProfile & { user: User })[]> {
    const workers = await db.select()
      .from(workerProfiles)
      .where(eq(workerProfiles.primarySkill, skill));
    
    return Promise.all(
      workers.map(async (profile) => {
        const user = await this.getUser(profile.userId);
        return { ...profile, user: user! };
      })
    );
  }

  async getTopRatedWorkers(limit: number = 4): Promise<(WorkerProfile & { user: User })[]> {
    const workers = await db.select()
      .from(workerProfiles)
      .orderBy(desc(workerProfiles.averageRating))
      .limit(limit);
    
    return Promise.all(
      workers.map(async (profile) => {
        const user = await this.getUser(profile.userId);
        return { ...profile, user: user! };
      })
    );
  }

  // Job operations
  async getJob(id: number): Promise<(Job & { employer: User }) | undefined> {
    const jobResult = await db.select().from(jobs).where(eq(jobs.id, id));
    const job = jobResult[0];
    if (!job) return undefined;
    
    const employer = await this.getUser(job.employerId);
    if (!employer) return undefined;
    
    return { ...job, employer };
  }

  async getJobs(filters?: {category?: string, location?: string, isActive?: boolean}): Promise<(Job & { employer: User })[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(jobs.category, filters.category));
    if (filters?.location) conditions.push(like(jobs.location, `%${filters.location}%`));
    if (filters?.isActive !== undefined) conditions.push(eq(jobs.isActive, filters.isActive));
    const jobsList = await db.select().from(jobs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt));
    
    return Promise.all(
      jobsList.map(async (job) => {
        const employer = await this.getUser(job.employerId);
        return { ...job, employer: employer! };
      })
    );
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values({
      ...job,
      isActive: true
    }).returning();
    return result[0];
  }

  async updateJob(id: number, update: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set(update)
      .where(eq(jobs.id, id))
      .returning();
    
    return result[0];
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return db.select()
      .from(jobs)
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(jobs.createdAt));
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const result = await db.select().from(applications).where(eq(applications.id, id));
    return result[0];
  }

  async getApplicationsByWorker(workerId: number): Promise<(Application & { job: Job })[]> {
    try {
      const appResults = await db.select()
        .from(applications)
        .where(eq(applications.workerId, workerId));
      
      if (appResults.length === 0) {
        return [];
      }
      
      return Promise.all(
        appResults.map(async (app) => {
          try {
            const jobResult = await db.select().from(jobs).where(eq(jobs.id, app.jobId));
            if (jobResult.length === 0) {
              // Return the application with a default job to avoid errors
              return { 
                ...app, 
                job: {
                  id: app.jobId,
                  title: "Unknown Job",
                  description: "",
                  location: "",
                  category: "",
                  wage: "",
                  duration: null,
                  employerId: 0,
                  isActive: false,
                  expiresAt: null,
                  createdAt: new Date()
                } 
              };
            }
            return { ...app, job: jobResult[0] };
          } catch (error) {
            console.error("Error fetching job for application:", error);
            // Return the application with a default job to avoid errors
            return { 
              ...app, 
              job: {
                id: app.jobId,
                title: "Error Fetching Job",
                description: "",
                location: "",
                category: "",
                wage: "",
                duration: null,
                employerId: 0,
                isActive: false,
                expiresAt: null,
                createdAt: new Date()
              } 
            };
          }
        })
      );
    } catch (error) {
      console.error("Error in getApplicationsByWorker:", error);
      return [];
    }
  }

  async getApplicationsByJob(jobId: number): Promise<(Application & { worker: User })[]> {
    const appResults = await db.select()
      .from(applications)
      .where(eq(applications.jobId, jobId));
    
    return Promise.all(
      appResults.map(async (app) => {
        const worker = await this.getUser(app.workerId);
        return { ...app, worker: worker! };
      })
    );
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const result = await db.insert(applications).values({
      ...application,
      status: "pending"
    }).returning();
    return result[0];
  }

  async updateApplicationStatus(id: number, status: "pending" | "shortlisted" | "accepted" | "rejected" | "completed"): Promise<Application | undefined> {
    const result = await db.update(applications)
      .set({ status })
      .where(eq(applications.id, id))
      .returning();
    
    return result[0];
  }

  // Rating operations
  async getRatingsByWorker(workerId: number): Promise<Rating[]> {
    try {
      const result = await db.select()
        .from(ratings)
        .where(eq(ratings.workerId, workerId))
        .orderBy(desc(ratings.createdAt));
      
      return result;
    } catch (error) {
      console.error("Error in getRatingsByWorker:", error);
      return [];
    }
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const result = await db.insert(ratings).values({
      ...rating,
      comment: rating.comment || null
    }).returning();
    
    // Update worker profile average rating
    const workerProfile = await this.getWorkerProfile(rating.workerId);
    if (workerProfile) {
      const ratings = await this.getRatingsByWorker(rating.workerId);
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / ratings.length;
      
      await this.updateWorkerProfile(rating.workerId, {
        averageRating,
        totalRatings: ratings.length
      });
    }
    
    return result[0];
  }

  // Update a user's verification status
  async updateUserVerification(id: number, verificationStatus: "not_submitted" | "pending" | "verified" | "rejected"): Promise<User | undefined> {
    try {
      const isVerified = verificationStatus === "verified";
      const result = await db.update(users)
        .set({ 
          verificationStatus,
          isVerified
        })
        .where(eq(users.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error in updateUserVerification:", error);
      throw error;
    }
  }

  // Update a user's email verification code
  async updateUserVerificationCode(userId: number, code: string, expires: Date): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({ 
          verificationCode: code,
          verificationCodeExpires: expires
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error in updateUserVerificationCode:", error);
      throw error;
    }
  }

  // Update a user's email verification status
  async updateUserEmailVerification(userId: number, verified: boolean): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({ emailVerified: verified })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error in updateUserEmailVerification:", error);
      throw error;
    }
  }
  
  async deleteAllUsers(): Promise<void> {
    try {
      // Delete related records in other tables first (handle foreign key constraints)
      await db.delete(ratings);
      await db.delete(applications);
      await db.delete(jobs);
      await db.delete(verificationDocuments);
      await db.delete(workerProfiles);
      
      // Finally delete users
      await db.delete(users);
      
      console.log("All user data successfully deleted from database");
    } catch (error) {
      console.error("Error in deleteAllUsers:", error);
      throw error;
    }
  }
  
  // Get verification documents for a user
  async getVerificationDocuments(userId: number): Promise<VerificationDocument[]> {
    try {
      const result = await db.select()
        .from(verificationDocuments)
        .where(eq(verificationDocuments.userId, userId))
        .orderBy(desc(verificationDocuments.submittedAt));
      
      return result;
    } catch (error) {
      console.error("Error in getVerificationDocuments:", error);
      throw error;
    }
  }
  
  // Create a new verification document entry
  async createVerificationDocument(document: InsertVerificationDocument): Promise<VerificationDocument> {
    try {
      const result = await db.insert(verificationDocuments)
        .values(document)
        .returning();
      
      // Update the user's verification status to "pending"
      await this.updateUserVerification(document.userId, "pending");
      
      return result[0];
    } catch (error) {
      console.error("Error in createVerificationDocument:", error);
      throw error;
    }
  }
  
  // Update an existing verification document (typically during review)
  async updateVerificationDocument(id: number, reviewNotes?: string, reviewedAt?: Date): Promise<VerificationDocument | undefined> {
    try {
      const updates: any = {};
      
      if (reviewNotes !== undefined) {
        updates.verificationNotes = reviewNotes;
      }
      
      if (reviewedAt !== undefined) {
        updates.reviewedAt = reviewedAt;
      }
      
      const result = await db.update(verificationDocuments)
        .set(updates)
        .where(eq(verificationDocuments.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error in updateVerificationDocument:", error);
      throw error;
    }
  }

  // Messaging operations - Conversations
  async getConversation(id: number): Promise<Conversation | undefined> {
    try {
      const result = await db.select().from(conversations).where(eq(conversations.id, id));
      if (result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("Error in getConversation:", error);
      throw error;
    }
  }

  async getConversationByParticipants(participant1Id: number, participant2Id: number): Promise<Conversation | undefined> {
    try {
      // Find a conversation where these two users are participants, regardless of order
      const result = await db.select().from(conversations)
        .where(
          or(
            and(
              eq(conversations.participant1Id, participant1Id),
              eq(conversations.participant2Id, participant2Id)
            ),
            and(
              eq(conversations.participant1Id, participant2Id),
              eq(conversations.participant2Id, participant1Id)
            )
          )
        );
      
      if (result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("Error in getConversationByParticipants:", error);
      throw error;
    }
  }

  async getConversationsByUser(userId: number): Promise<(Conversation & { otherParticipant: User, lastMessage?: Message })[]> {
    try {
      // Find all conversations where this user is a participant
      const userConversations = await db.select().from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));
      
      // Fetch other participant and optional last message for each conversation
      return Promise.all(userConversations.map(async (conv) => {
        const otherParticipantId = conv.participant1Id === userId 
          ? conv.participant2Id 
          : conv.participant1Id;
          
        const otherParticipant = await this.getUser(otherParticipantId);
        
        // Get last message
        const messagesResult = await db.select().from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.sentAt))
          .limit(1);
        
        const lastMessage = messagesResult.length > 0 ? messagesResult[0] : undefined;
        
        return { 
          ...conv, 
          otherParticipant: otherParticipant!, 
          lastMessage 
        };
      }));
    } catch (error) {
      console.error("Error in getConversationsByUser:", error);
      throw error;
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const result = await db.insert(conversations).values({
        ...conversation,
        lastMessageAt: new Date(),
        jobId: conversation.jobId ?? null, // Ensure jobId is not undefined
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error in createConversation:", error);
      throw error;
    }
  }

  async updateConversationLastMessage(id: number, lastMessageAt: Date = new Date()): Promise<Conversation | undefined> {
    try {
      const result = await db.update(conversations)
        .set({ lastMessageAt })
        .where(eq(conversations.id, id))
        .returning();
      
      if (result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("Error in updateConversationLastMessage:", error);
      throw error;
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const result = await db.select().from(messages).where(eq(messages.id, id));
      if (result.length === 0) return undefined;
      return result[0];
    } catch (error) {
      console.error("Error in getMessage:", error);
      throw error;
    }
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    try {
      return await db.select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.sentAt); // Sort from oldest to newest
    } catch (error) {
      console.error("Error in getMessagesByConversation:", error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const result = await db.insert(messages).values({
        ...message,
        sentAt: new Date(),
        metadata: message.metadata ?? {}, // Ensure metadata is not undefined
      }).returning();
      
      // Update conversation's last message timestamp
      await this.updateConversationLastMessage(message.conversationId);
      
      return result[0];
    } catch (error) {
      console.error("Error in createMessage:", error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    try {
      const now = new Date();
      
      // Find all unread messages in this conversation sent to this user
      await db.update(messages)
        .set({ readAt: now })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            and(
              not(eq(messages.senderId, userId)), // Not sent by this user
              isNull(messages.readAt) // Not already read
            )
          )
        );
    } catch (error) {
      console.error("Error in markMessagesAsRead:", error);
      throw error;
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
