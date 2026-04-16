import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react";

async function getCourse(slug) {
  return prisma.course.findUnique({
    where: { slug, isPublished: true },
    include: {
      topics: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }) {
  const { courseSlug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    select: { title: true, description: true },
  });
  return {
    title: course ? `${course.title} — QuestionS` : "Course",
    description: course?.description,
  };
}

export default async function CoursePage({ params }) {
  const { courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const difficultyColors = {
    EASY: "bg-emerald-900 text-emerald-300",
    MEDIUM: "bg-amber-900 text-amber-300",
    HARD: "bg-red-900 text-red-300",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All Courses
      </Link>

      {/* Course header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-slate-400">{course.description}</p>
        )}
        <div className="mt-3">
          <Badge className="bg-slate-700 text-slate-300">
            {course.topics.length} topic{course.topics.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Topics */}
      {course.topics.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>No topics available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {course.topics.map((topic, idx) => (
            <Link
              key={topic.id}
              href={`/courses/${course.slug}/${topic.slug}`}
            >
              <div className="bg-[#243447] border border-slate-700 rounded-lg px-5 py-4 hover:border-blue-500 hover:bg-[#2a3d55] transition-all group flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 text-sm font-mono w-6 text-right">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                      {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-slate-400 text-sm mt-0.5">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <Badge className="bg-slate-700 text-slate-400 text-xs">
                    {topic._count.questions} Q
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
