import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * POST /api/mock-attempts/[attemptId]/submit
 * Finalize mock attempt. Computes score from saved answers.
 * Sets autoSubmitted=true if deadline already passed when called.
 * Idempotent — returns existing result if already completed.
 */
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkLimit("mock", `mock_submit:${session.user.id}`);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { attemptId } = await params;

    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: { select: { isCorrect: true } } },
    });
    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (attempt.completedAt) {
      return NextResponse.json({
        attemptId: attempt.id,
        scorePercentage: attempt.scorePercentage,
        autoSubmitted: attempt.autoSubmitted,
      });
    }

    const correct = attempt.answers.filter((a) => a.isCorrect).length;
    const score = attempt.totalQuestions
      ? Math.round((correct / attempt.totalQuestions) * 100)
      : 0;
    const now = new Date();
    const expired = attempt.deadlineAt <= now;

    const updated = await prisma.mockAttempt.update({
      where: { id: attemptId },
      data: {
        correctAnswers: correct,
        scorePercentage: score,
        completedAt: now,
        autoSubmitted: expired,
      },
      select: { id: true, scorePercentage: true, autoSubmitted: true },
    });

    return NextResponse.json({
      attemptId: updated.id,
      scorePercentage: updated.scorePercentage,
      autoSubmitted: updated.autoSubmitted,
    });
  } catch (err) {
    logger.error("mock_submit_failed", err, { path: "/api/mock-attempts/[id]/submit" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
