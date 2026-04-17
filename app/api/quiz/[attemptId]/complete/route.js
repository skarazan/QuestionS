import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * POST /api/quiz/[attemptId]/complete
 * Finalize attempt — compute score, set completedAt. Idempotent.
 */
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkLimit("quiz", `quiz:${session.user.id}`);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { attemptId } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        totalQuestions: true,
        completedAt: true,
        answers: { select: { isCorrect: true } },
      },
    });
    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (attempt.completedAt) {
      return NextResponse.json({ attemptId: attempt.id }, { status: 200 });
    }

    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const scorePercentage = attempt.totalQuestions
      ? Math.round((correctCount / attempt.totalQuestions) * 100)
      : 0;

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        correctAnswers: correctCount,
        scorePercentage,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ attemptId: attempt.id, scorePercentage });
  } catch (err) {
    logger.error("quiz_complete_failed", err, { path: "/api/quiz/[attemptId]/complete" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
