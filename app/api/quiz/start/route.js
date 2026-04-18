import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z, ZodError } from "zod";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

const startSchema = z.object({
  topicId: z.string().cuid(),
  count: z.coerce.number().int().min(1).max(1000).optional(), // null = all available
});

/** Fisher-Yates shuffle in-place */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * POST /api/quiz/start
 * Body: { topicId, count? }
 *
 * Selects questions for this session:
 * - Excludes questions answered in the user's last 5 completed attempts.
 * - If remaining pool < count (or all seen), resets to full pool.
 * - Randomizes + takes min(count, pool.length).
 * - Stores selected IDs on the attempt for /questions to return.
 */
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkLimit("quiz", `quiz:${session.user.id}`);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
      );
    }

    const { topicId, count } = startSchema.parse(await req.json());

    // All question IDs for this topic
    const allQuestions = await prisma.question.findMany({
      where: { topicId },
      select: { id: true },
      orderBy: { order: "asc" },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: "No questions in topic" }, { status: 400 });
    }

    const allIds = allQuestions.map((q) => q.id);

    // Find question IDs answered in last 5 completed attempts by this user
    const lastAttempts = await prisma.quizAttempt.findMany({
      where: { userId: session.user.id, topicId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: { id: true },
    });

    let excludedIds = new Set();
    if (lastAttempts.length > 0) {
      const answered = await prisma.quizAttemptQuestion.findMany({
        where: { attemptId: { in: lastAttempts.map((a) => a.id) } },
        select: { questionId: true },
      });
      excludedIds = new Set(answered.map((a) => a.questionId));
    }

    // Available pool = all minus recently seen
    let pool = allIds.filter((id) => !excludedIds.has(id));

    // If pool exhausted (all seen), reset to full bank
    if (pool.length === 0) {
      pool = [...allIds];
    }

    // Shuffle and take requested count
    shuffle(pool);
    const desired = count ?? pool.length;
    const selected = pool.slice(0, Math.min(desired, pool.length));

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        topicId,
        totalQuestions: selected.length,
        selectedQuestionIds: selected,
        startedAt: new Date(),
      },
      select: { id: true },
    });

    return NextResponse.json(
      { attemptId: attempt.id, totalQuestions: selected.length },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("quiz_start_failed", err, { path: "/api/quiz/start" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
