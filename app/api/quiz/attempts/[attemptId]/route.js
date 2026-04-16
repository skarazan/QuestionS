import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTopicPercentile, getCoursePercentile } from "@/lib/percentile";

// GET /api/quiz/attempts/[attemptId] — get attempt results
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        topic: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Users can only see their own attempts
    if (attempt.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Compute percentiles
    const topicPercentile = await getTopicPercentile(
      attempt.topicId,
      attempt.scorePercentage ?? 0
    );
    const coursePercentile = await getCoursePercentile(
      attempt.topic.courseId,
      attempt.userId
    );

    // Strip correct answer info from options if showAnswers is false on question
    const sanitizedAnswers = attempt.answers.map((a) => {
      const question = a.question;
      const showAnswers = question.showAnswers;
      const showExplanation = question.showExplanation;

      return {
        questionId: question.id,
        questionText: question.text,
        difficulty: question.difficulty,
        explanation: showExplanation ? question.explanation : null,
        showAnswers,
        selectedOptionId: a.selectedOptionId,
        isCorrect: a.isCorrect,
        options: question.options.map((o) => ({
          id: o.id,
          text: o.text,
          order: o.order,
          isCorrect: showAnswers ? o.isCorrect : null,
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
