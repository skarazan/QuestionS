import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTopicPercentile, getCoursePercentile } from "@/lib/percentile";

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { attemptId } = await params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        topic: { include: { course: { select: { id: true, title: true, slug: true } } } },
        answers: {
          include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (attempt.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const topicPercentile = await getTopicPercentile(attempt.topicId, attempt.scorePercentage ?? 0);
    const coursePercentile = await getCoursePercentile(attempt.topic.courseId, attempt.userId);

    const sanitizedAnswers = attempt.answers.map((a) => {
      const question = a.question;
      return {
        questionId: question.id,
        questionText: question.text,
        difficulty: question.difficulty,
        explanation: question.showExplanation ? question.explanation : null,
        showAnswers: question.showAnswers,
        selectedOptionId: a.selectedOptionId,
        isCorrect: a.isCorrect,
        options: question.options.map((o) => ({
          id: o.id,
          text: o.text,
          order: o.order,
          isCorrect: question.showAnswers ? o.isCorrect : null,
        })),
      };
    });

    return NextResponse.json({
      id: attempt.id,
      topicId: attempt.topicId,
      topicTitle: attempt.topic.title,
      courseTitle: attempt.topic.course.title,
      courseSlug: attempt.topic.course.slug,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      scorePercentage: attempt.scorePercentage,
      completedAt: attempt.completedAt,
      topicPercentile,
      coursePercentile,
      answers: sanitizedAnswers,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
