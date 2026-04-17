import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { submitQuizSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * Legacy bulk-submit endpoint (kept for backwards compatibility).
 * Preferred UWorld-style path:
 *   POST /api/quiz/start → POST /api/quiz/[attemptId]/answer → POST /api/quiz/[attemptId]/complete
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

    const body = await req.json();
    const { topicId, answers } = submitQuizSchema.parse(body);

    // Load ALL questions for topic + validate every submitted questionId belongs
    const questions = await prisma.question.findMany({
      where: { topicId },
      include: { options: { select: { id: true, isCorrect: true } } },
      orderBy: { order: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 400 });
    }

    const qIdSet = new Set(questions.map((q) => q.id));
    const allBelong = answers.every((a) => qIdSet.has(a.questionId));
    if (!allBelong) {
      return NextResponse.json({ error: "Invalid question in submission" }, { status: 400 });
    }

    let correctCount = 0;
    const scoredAnswers = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      const opt = question?.options.find((o) => o.id === answer.selectedOptionId);
      const isCorrect = !!opt?.isCorrect;
      if (isCorrect) correctCount++;
      return { ...answer, isCorrect };
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    const attempt = await prisma.$transaction(async (tx) => {
      return tx.quizAttempt.create({
        data: {
          userId: session.user.id, // always server-sourced, never body
          topicId,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          scorePercentage,
          startedAt: new Date(),
          completedAt: new Date(),
          answers: {
            create: scoredAnswers.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isCorrect: a.isCorrect,
              answeredAt: new Date(),
            })),
          },
        },
      });
    });

    return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("quiz_bulk_submit_failed", err, { path: "/api/quiz" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
