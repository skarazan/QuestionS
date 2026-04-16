import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

export const topicSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

export const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
});

export const questionSchema = z.object({
  text: z.string().min(5, "Question must be at least 5 characters"),
  explanation: z.string().optional(),
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

export const submitQuizSchema = z.object({
  topicId: z.string().cuid(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      selectedOptionId: z.string().cuid().nullable(),
    })
  ),
});
