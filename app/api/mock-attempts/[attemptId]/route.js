import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/mock-attempts/[attemptId]
 * Returns attempt state + questions (WITHOUT isCorrect) + user's saved answers.
 * Exam mode: no explanation, no correct option until completedAt.
 * When completedAt is set, includes full question data + explanations.
 */
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;

    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            questions: {
              orderBy: { order: "asc" },
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { order: "asc" },
                      // isCorrect intentionally omitted during exam
                    },
                  },
                },
              },
            },
          },
        },
        answers: {
          select: { questionId: true, selectedOptionId: true, isCorrect: true, answeredAt: true },
        },
      },
    });

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isCompleted = !!attempt.completedAt;

    // Strip isCorrect from options unless completed
    const questions = attempt.mockTest.questions.map((mq) => {
      const q = mq.question;
      return {
        id: q.id,
        text: q.text,
        difficulty: q.difficulty,
        order: mq.order,
        explanation: isCompleted ? q.explanation : null,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          order: o.order,
          ...(isCompleted ? { isCorrect: o.isCorrect } : {}),
        })),
      };
    });

    return NextResponse.json({
      id: attempt.id,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      completedAt: attempt.completedAt,
      autoSubmitted: attempt.autoSubmitted,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: isCompleted ? attempt.correctAnswers : null,
      scorePercentage: isCompleted ? attempt.scorePercentage : null,
      mockTest: { id: attempt.mockTest.id, title: attempt.mockTest.title },
      questions,
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        ...(isCompleted ? { isCorrect: a.isCorrect } : {}),
      })),
    });
  } catch (err) {
    logger.error("mock_attempt_get_failed", err, { path: "/api/mock-attempts/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
