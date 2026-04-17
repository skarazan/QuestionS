import { z } from "zod";
import { sanitizeText, sanitizeRichText, hasBadChars } from "./sanitize";

// Reject control chars / null bytes across all string input
const safeString = (min, max, label) =>
  z
    .string()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine((s) => !hasBadChars(s), `${label} contains invalid characters`);

const plainText = (min, max, label) =>
  safeString(min, max, label).transform(sanitizeText);

const richText = (max, label) =>
  z
    .string()
    .max(max, `${label} must be at most ${max} characters`)
    .refine((s) => !hasBadChars(s), `${label} contains invalid characters`)
    .transform(sanitizeRichText);

const slug = z
  .string()
  .min(1, "Slug is required")
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

const safeUrl = z
  .string()
  .url("Must be a valid URL")
  .refine((u) => /^https?:\/\//i.test(u), "URL must use http or https");

// ========== AUTH ==========

export const registerSchema = z
  .object({
    name: plainText(2, 80, "Name"),
    email: z.string().email("Invalid email address").max(254).transform((s) => s.trim().toLowerCase()),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(200)
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  })
  .strict(); // reject unknown keys (e.g. `role`)

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

// ========== CONTENT ==========

export const courseSchema = z.object({
  title: plainText(3, 255, "Title"),
  description: richText(2000, "Description").optional(),
  slug,
  imageUrl: safeUrl.optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

export const topicSchema = z.object({
  title: plainText(3, 255, "Title"),
  description: richText(2000, "Description").optional(),
  slug,
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

export const optionSchema = z.object({
  text: plainText(1, 500, "Option text"),
  isCorrect: z.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
});

export const questionSchema = z.object({
  text: plainText(5, 5000, "Question"),
  explanation: richText(10000, "Explanation").optional(),
  showExplanation: z.boolean().default(true),
  showAnswers: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  options: z
    .array(optionSchema)
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed")
    .refine(
      (opts) => opts.some((o) => o.isCorrect),
      "At least one option must be marked as correct"
    )
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      "Exactly one option must be marked as correct"
    ),
});

// ========== QUIZ ==========

// Single-question submit (UWorld practice mode)
export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  selectedOptionId: z.string().cuid(),
});

// Legacy batch submit (kept for backwards compat)
export const submitQuizSchema = z.object({
  topicId: z.string().cuid(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      selectedOptionId: z.string().cuid().nullable(),
    })
  ),
});

// ========== MOCK TEST ==========

export const mockTestSchema = z.object({
  title: plainText(3, 255, "Title"),
  description: richText(2000, "Description").optional(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(600, "Duration cannot exceed 600 minutes"),
  isPublished: z.boolean().default(false),
  questionIds: z.array(z.string().cuid()).min(1, "At least 1 question required").max(500),
});

export const submitMockSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      selectedOptionId: z.string().cuid().nullable(),
    })
  ),
});
