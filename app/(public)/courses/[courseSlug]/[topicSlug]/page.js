import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import QuizContainer from "@/components/quiz/QuizContainer";
import { ArrowLeft } from "lucide-react";
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
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, order: true },
          },
        },
      },
    },
  });
  if (!topic) return null;
  return { ...topic, course };
}

export default async function TopicPage({ params }) {
  const session = await auth();
  const topic = await getTopic(params.courseSlug, params.topicSlug);
  if (!topic) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-white transition-colors">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${topic.course.slug}`} className="hover:text-white transition-colors">
          {topic.course.title}
        </Link>
        <span>/</span>
        <span className="text-slate-300">{topic.title}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
        {topic.description && (
          <p className="text-slate-400 mt-1">{topic.description}</p>
        )}
        <p className="text-slate-500 text-sm mt-2">
          {topic.questions.length} question{topic.questions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {topic.questions.length === 0 ? (
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
        <QuizContainer topic={topic} userId={session.user.id} />
      )}
    </div>
  );
}
