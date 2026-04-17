import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { ZodError } from "zod";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

const startSchema = z.object({ topicId: z.string().cuid() });

/**
 * POST /api/quiz/start
 * Creates an open practice attempt for the given topic.
 * Returns attemptId + totalQuestions (client will request questions separately).
 */
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkLimit("quiz", `quiz:${session.user.id}`);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { topicId } = startSchema.parse(await req.json());

    const total = await prisma.question.count({ where: { topicId } });
    if (total === 0) {
      return NextResponse.json({ error: "No questions in topic" }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        topicId,
        totalQuestions: total,
        startedAt: new Date(),
      },
      select: { id: true, totalQuestions: true, startedAt: true },
    });

    return NextResponse.json({ attemptId: attempt.id, totalQuestions: total }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("quiz_start_failed", err, { path: "/api/quiz/start" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
