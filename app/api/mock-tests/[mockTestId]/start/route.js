import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * POST /api/mock-tests/[mockTestId]/start
 * - If user has an active (non-completed, non-expired) attempt → resume it
 * - If user has an active but expired attempt → auto-submit and return it
 * - Otherwise → create new attempt with server-computed deadlineAt
 */
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkLimit("mock", `mock:${session.user.id}`);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { mockTestId } = await params;

    const mock = await prisma.mockTest.findFirst({
      where: { id: mockTestId, isPublished: true },
      select: { id: true, durationMinutes: true, _count: { select: { questions: true } } },
    });
    if (!mock) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!mock._count.questions) {
      return NextResponse.json({ error: "Mock test has no questions" }, { status: 400 });
    }

    // Find active attempt
    const active = await prisma.mockAttempt.findFirst({
      where: { userId: session.user.id, mockTestId, completedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (active) {
      if (active.deadlineAt <= new Date()) {
        // Expired → auto-submit now
        const submitted = await autoSubmit(active.id);
        return NextResponse.json({ attemptId: submitted.id, expired: true });
      }
      return NextResponse.json({
        attemptId: active.id,
        deadlineAt: active.deadlineAt,
        startedAt: active.startedAt,
      });
    }

    // New attempt
    const now = new Date();
    const deadline = new Date(now.getTime() + mock.durationMinutes * 60 * 1000);
    const attempt = await prisma.mockAttempt.create({
      data: {
        userId: session.user.id,
        mockTestId,
        totalQuestions: mock._count.questions,
        startedAt: now,
        deadlineAt: deadline,
      },
      select: { id: true, startedAt: true, deadlineAt: true },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
    });
  } catch (err) {
    logger.error("mock_start_failed", err, { path: "/api/mock-tests/[id]/start" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function autoSubmit(attemptId) {
  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      totalQuestions: true,
      answers: { select: { isCorrect: true } },
    },
  });
  if (!attempt) return null;
  const correct = attempt.answers.filter((a) => a.isCorrect).length;
  const score = attempt.totalQuestions
    ? Math.round((correct / attempt.totalQuestions) * 100)
    : 0;
  return prisma.mockAttempt.update({
    where: { id: attemptId },
    data: {
      correctAnswers: correct,
      scorePercentage: score,
      completedAt: new Date(),
      autoSubmitted: true,
    },
  });
}
