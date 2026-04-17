import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { submitAnswerSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * POST /api/quiz/[attemptId]/answer
 * Submit a single answer. Returns correctness + correct option id + explanation.
 * Locks answer (unique constraint on (attemptId, questionId) + we block updates).
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
    const { questionId, selectedOptionId } = submitAnswerSchema.parse(await req.json());

    // Load attempt + ensure it belongs to session user + not completed
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, topicId: true, completedAt: true },
    });
    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (attempt.completedAt) {
      return NextResponse.json({ error: "Attempt already completed" }, { status: 400 });
    }

    // Validate question belongs to attempt's topic
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        topicId: true,
        explanation: true,
        showExplanation: true,
        showAnswers: true,
        options: { select: { id: true, isCorrect: true } },
      },
    });
    if (!question || question.topicId !== attempt.topicId) {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }

    const selected = question.options.find((o) => o.id === selectedOptionId);
    if (!selected) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }
    const isCorrect = selected.isCorrect;
    const correctOption = question.options.find((o) => o.isCorrect);

    // Insert-only — prevent re-answer via unique constraint
    try {
      await prisma.quizAttemptQuestion.create({
        data: {
          attemptId,
          questionId,
          selectedOptionId,
          isCorrect,
          answeredAt: new Date(),
        },
      });
    } catch (err) {
      if (err?.code === "P2002") {
        return NextResponse.json({ error: "Already answered" }, { status: 400 });
      }
      throw err;
    }

    return NextResponse.json({
      isCorrect,
      correctOptionId: question.showAnswers ? correctOption?.id ?? null : null,
      explanation: question.showExplanation ? question.explanation ?? null : null,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("quiz_answer_failed", err, { path: "/api/quiz/[attemptId]/answer" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
