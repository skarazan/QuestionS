import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { submitQuizSchema } from "@/lib/validations";
import { ZodError } from "zod";

// POST /api/quiz — submit quiz attempt
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { topicId, answers } = submitQuizSchema.parse(body);

    // Fetch all questions + correct options for this topic
    const questions = await prisma.question.findMany({
      where: { topicId },
      include: {
        options: { select: { id: true, isCorrect: true } },
      },
      orderBy: { order: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 400 });
    }

    // Score answers
    let correctCount = 0;
    const scoredAnswers = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false };

      const selectedOption = question.options.find(
        (o) => o.id === answer.selectedOptionId
      );
      const isCorrect = selectedOption?.isCorrect ?? false;
      if (isCorrect) correctCount++;
      return { ...answer, isCorrect };
    });

    const scorePercentage =
      questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

    // Create attempt + answers in a transaction
    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({
        data: {
          userId: session.user.id,
          topicId,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          scorePercentage,
          completedAt: new Date(),
          answers: {
            create: scoredAnswers.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isCorrect: a.isCorrect,
            })),
          },
        },
      });
      return created;
    });

    return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
