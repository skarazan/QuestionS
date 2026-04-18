import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import QuizContainer from "@/components/quiz/QuizContainer";
import { ArrowLeft, Timer, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getTopic(courseSlug, topicSlug) {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug, isPublished: true },
    select: { id: true, title: true, slug: true },
  });
  if (!course) return null;

  const topic = await prisma.topic.findFirst({
    where: { courseId: course.id, slug: topicSlug, isPublished: true },
    include: {
      _count: { select: { questions: true } },
      mockTests: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          durationMinutes: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });
  if (!topic) return null;
  return { ...topic, course };
}

export default async function TopicPage({ params }) {
  const { courseSlug, topicSlug } = await params;
  const session = await auth();
  const topic = await getTopic(courseSlug, topicSlug);
  if (!topic) notFound();

  const questionCount = topic._count.questions;
  const hasQuestions = questionCount > 0;
  const isQuizActive = hasQuestions && !!session;

  return (
    <div className={isQuizActive ? "w-full px-4 py-6 2xl:px-8" : "max-w-4xl mx-auto px-4 py-8"}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link href="/" className="hover:text-white transition-colors">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${topic.course.slug}`} className="hover:text-white transition-colors">
          {topic.course.title}
        </Link>
        <span>/</span>
        <span className="text-slate-300">{topic.title}</span>
      </div>

      {!isQuizActive && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
          {topic.description && (
            <p className="text-slate-400 mt-1">{topic.description}</p>
          )}
          <p className="text-slate-500 text-sm mt-2">
            {questionCount} question{questionCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Mock Tests — only when not in active quiz */}
      {!isQuizActive && topic.mockTests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-blue-400" />
            <h2 className="text-white font-semibold">Mock Tests</h2>
          </div>
          <div className="grid gap-2">
            {topic.mockTests.map((m) => (
              <Link
                key={m.id}
                href={`/courses/${topic.course.slug}/${topic.slug}/mock-tests/${m.id}`}
                className="bg-[#1f2937] border border-slate-700 hover:border-blue-500 rounded-lg p-4 flex items-center justify-between transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium">{m.title}</div>
                  {m.description && (
                    <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">
                      {m.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" /> {m.durationMinutes} min
                    </span>
                    <span>·</span>
                    <span>
                      {m._count.questions} question
                      {m._count.questions !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 flex-shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {!hasQuestions ? (
        <div className="text-center py-16 text-slate-500">
          <p>No questions available for this topic yet.</p>
        </div>
      ) : !session ? (
        <div className="bg-[#243447] border border-slate-700 rounded-lg p-8 text-center">
          <h2 className="text-white text-lg font-semibold mb-2">Sign in to take this quiz</h2>
          <p className="text-slate-400 mb-4">Create a free account to track your progress and see how you rank.</p>
          <div className="flex justify-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href={`/login?callbackUrl=/courses/${topic.course.slug}/${topic.slug}`}>Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Link href="/register">Register Free</Link>
            </Button>
          </div>
        </div>
      ) : (
        <QuizContainer
          topicId={topic.id}
          topicTitle={topic.title}
          topicSlug={topic.slug}
          courseSlug={topic.course.slug}
          totalQuestions={questionCount}
        />
      )}
    </div>
  );
}
