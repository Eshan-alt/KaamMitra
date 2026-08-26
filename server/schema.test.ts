import assert from "node:assert/strict";
import test from "node:test";
import {
  insertJobSchema,
  insertMessageSchema,
  insertRatingSchema,
  insertUserSchema,
} from "../shared/schema";

const validUser = {
  username: "worker_one",
  password: "a-strong-password",
  fullName: "Worker One",
  phone: "+919876543210",
  email: "worker@example.com",
  userType: "worker" as const,
  location: "New Delhi",
};

test("registration schema normalizes identity fields", () => {
  const parsed = insertUserSchema.parse({
    ...validUser,
    username: "  WORKER_ONE ",
    email: " WORKER@EXAMPLE.COM ",
  });
  assert.equal(parsed.username, "worker_one");
  assert.equal(parsed.email, "worker@example.com");
});

test("registration schema rejects weak passwords and admin self-registration", () => {
  assert.equal(insertUserSchema.safeParse({ ...validUser, password: "short" }).success, false);
  assert.equal(insertUserSchema.safeParse({ ...validUser, userType: "admin" }).success, false);
});

test("job and message schemas enforce useful content limits", () => {
  assert.equal(insertJobSchema.safeParse({
    employerId: 2,
    title: "Fix",
    description: "Too short",
    location: "Delhi",
    category: "Plumbing",
    wage: "₹800/day",
  }).success, false);
  assert.equal(insertMessageSchema.safeParse({
    conversationId: 1,
    senderId: 1,
    content: " ".repeat(10),
  }).success, false);
});

test("rating schema enforces the one-to-five range", () => {
  assert.equal(insertRatingSchema.safeParse({
    workerId: 1,
    employerId: 2,
    jobId: 3,
    rating: 6,
  }).success, false);
});