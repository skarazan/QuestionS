import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { submitAnswerSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * POST /api/mock-attempts/[attemptId]/answer
 * Save or update an answer. No feedback returned (exam mode).
 * Deadline enforced server-side. Reject if expired or completed.
 * Allows updating answer until deadline (exam mode — free navigation).
 */
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkLimit("quiz", `mock_answer:${session.user.id}`);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { attemptId } = await params;
    const { questionId, selectedOptionId } = submitAnswerSchema.parse(await req.json());

    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, mockTestId: true, deadlineAt: true, completedAt: true },
    });
    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (attempt.completedAt) {
      return NextResponse.json({ error: "Attempt completed" }, { status: 400 });
    }
    if (attempt.deadlineAt <= new Date()) {
      return NextResponse.json({ error: "Time expired" }, { status: 400 });
    }

    // Verify question belongs to mock test
    const mq = await prisma.mockTestQuestion.findUnique({
      where: { mockTestId_questionId: { mockTestId: attempt.mockTestId, questionId } },
      select: { questionId: true },
    });
    if (!mq) return NextResponse.json({ error: "Invalid question" }, { status: 400 });

    // Verify option belongs to question + compute correctness (stored, hidden until submit)
    const option = await prisma.option.findUnique({
      where: { id: selectedOptionId },
      select: { id: true, questionId: true, isCorrect: true },
    });
    if (!option || option.questionId !== questionId) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    // Upsert — allow changes during exam
    await prisma.mockAttemptQuestion.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        selectedOptionId,
        isCorrect: option.isCorrect,
        answeredAt: new Date(),
      },
      update: {
        selectedOptionId,
        isCorrect: option.isCorrect,
        answeredAt: new Date(),
      },
    });

    // No feedback — just ack
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("mock_answer_failed", err, { path: "/api/mock-attempts/[id]/answer" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
