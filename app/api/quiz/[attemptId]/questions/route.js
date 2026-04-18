import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/quiz/[attemptId]/questions
 * Returns the questions selected for this attempt, in order.
 * Options do NOT include isCorrect — correctness determined server-side on answer submit.
 */
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        completedAt: true,
        selectedQuestionIds: true,
      },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (attempt.selectedQuestionIds.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Fetch questions in one query, then re-order to match selectedQuestionIds
    const questions = await prisma.question.findMany({
      where: { id: { in: attempt.selectedQuestionIds } },
      select: {
        id: true,
        text: true,
        difficulty: true,
        showAnswers: true,
        showExplanation: true,
        options: {
          orderBy: { order: "asc" },
          select: { id: true, text: true, order: true },
        },
      },
    });

    // Re-order to match stored selection order (Prisma doesn't guarantee IN order)
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const ordered = attempt.selectedQuestionIds
      .map((id) => qMap.get(id))
      .filter(Boolean);

    return NextResponse.json({ questions: ordered });
  } catch (err) {
    logger.error("quiz_questions_failed", err, {
      path: "/api/quiz/[attemptId]/questions",
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
