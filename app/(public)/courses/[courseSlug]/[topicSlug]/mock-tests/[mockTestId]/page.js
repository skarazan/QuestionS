import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import MockTestIntro from "@/components/mock/MockTestIntro";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getMockTest(courseSlug, topicSlug, mockTestId) {
  const mock = await prisma.mockTest.findFirst({
    where: {
      id: mockTestId,
      isPublished: true,
      topic: {
        slug: topicSlug,
        isPublished: true,
        course: { slug: courseSlug, isPublished: true },
      },
    },
    include: {
      topic: {
        select: {
          id: true,
          title: true,
          slug: true,
          course: { select: { title: true, slug: true } },
        },
      },
      _count: { select: { questions: true } },
    },
  });
  return mock;
}

export default async function MockTestIntroPage({ params }) {
  const { courseSlug, topicSlug, mockTestId } = await params;
  const session = await auth();
  const mock = await getMockTest(courseSlug, topicSlug, mockTestId);
  if (!mock) notFound();

  // Check for existing attempt if logged in
  let existing = null;
  if (session?.user?.id) {
    existing = await prisma.mockAttempt.findFirst({
      where: { userId: session.user.id, mockTestId: mock.id },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        completedAt: true,
        deadlineAt: true,
        scorePercentage: true,
        autoSubmitted: true,
      },
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link href="/" className="hover:text-white">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${mock.topic.course.slug}`} className="hover:text-white">
          {mock.topic.course.title}
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${mock.topic.course.slug}/${mock.topic.slug}`}
          className="hover:text-white"
        >
          {mock.topic.title}
        </Link>
        <span>/</span>
        <span className="text-slate-300">{mock.title}</span>
      </div>

      <Link
        href={`/courses/${mock.topic.course.slug}/${mock.topic.slug}`}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Topic
      </Link>

      {!session ? (
        <div className="bg-[#243447] border border-slate-700 rounded-lg p-8 text-center">
          <h2 className="text-white text-lg font-semibold mb-2">
            Sign in to start the mock test
          </h2>
          <p className="text-slate-400 mb-4">
            Create a free account to take timed exams and track your results.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link
                href={`/login?callbackUrl=/courses/${mock.topic.course.slug}/${mock.topic.slug}/mock-tests/${mock.id}`}
              >
                Sign In
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Link href="/register">Register Free</Link>
            </Button>
          </div>
        </div>
      ) : (
        <MockTestIntro
          mockTest={{
            id: mock.id,
            title: mock.title,
            description: mock.description,
            durationMinutes: mock.durationMinutes,
            questionCount: mock._count.questions,
          }}
          existingAttempt={existing}
          courseSlug={mock.topic.course.slug}
          topicSlug={mock.topic.slug}
        />
      )}
    </div>
  );
}
