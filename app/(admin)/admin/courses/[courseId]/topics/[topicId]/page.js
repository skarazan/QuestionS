import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminQuestionActions from "@/components/admin/AdminQuestionActions";
import AdminMockTestActions from "@/components/admin/AdminMockTestActions";
import { Plus, Pencil, CheckCircle, Timer } from "lucide-react";

async function getTopic(topicId) {
  return prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      mockTests: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { questions: true, attempts: true } } },
      },
    },
  });
}

const difficultyColors = {
  EASY: "bg-emerald-900 text-emerald-300",
  MEDIUM: "bg-amber-900 text-amber-300",
  HARD: "bg-red-900 text-red-300",
};

export default async function AdminTopicPage({ params }) {
  const { courseId, topicId } = await params;
  const topic = await getTopic(topicId);
  if (!topic) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin/courses" className="text-slate-400 hover:text-white">Courses</Link>
        <span className="text-slate-600">/</span>
        <Link href={`/admin/courses/${courseId}`} className="text-slate-400 hover:text-white">{topic.course.title}</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300">{topic.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
            <Badge className={topic.isPublished ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-400"}>
              {topic.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          {topic.description && <p className="text-slate-400 mt-1">{topic.description}</p>}
          <p className="text-slate-500 text-sm mt-1">{topic.questions.length} question{topic.questions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Link href={`/admin/courses/${courseId}/topics/${topicId}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Topic
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/admin/courses/${courseId}/topics/${topicId}/questions/new`}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Question
            </Link>
          </Button>
        </div>
      </div>

      {/* Mock Tests Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-blue-400" />
            <h2 className="text-white font-semibold">Mock Tests</h2>
            <span className="text-slate-500 text-xs">
              {topic.mockTests.length} total
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Link href={`/admin/courses/${courseId}/topics/${topicId}/mock-tests/new`}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Mock Test
            </Link>
          </Button>
        </div>

        {topic.mockTests.length === 0 ? (
          <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6 text-center">
            <p className="text-slate-500 text-sm">No mock tests yet.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {topic.mockTests.map((m) => (
              <div
                key={m.id}
                className="bg-[#1f2937] border border-slate-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{m.title}</span>
                    <Badge
                      className={
                        m.isPublished
                          ? "bg-emerald-900 text-emerald-300"
                          : "bg-slate-700 text-slate-400"
                      }
                    >
                      {m.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" /> {m.durationMinutes} min
                    </span>
                    <span>·</span>
                    <span>{m._count.questions} question{m._count.questions !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>{m._count.attempts} attempt{m._count.attempts !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <AdminMockTestActions
                  courseId={courseId}
                  topicId={topicId}
                  mockTestId={m.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions Section header */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-white font-semibold">Questions</h2>
        <span className="text-slate-500 text-xs">
          {topic.questions.length} total
        </span>
      </div>

      {topic.questions.length === 0 ? (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-500 mb-4">No questions yet.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/admin/courses/${courseId}/topics/${topicId}/questions/new`}>Add First Question</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {topic.questions.map((q, idx) => (
            <div key={q.id} className="bg-[#1f2937] border border-slate-700 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-500 text-xs font-mono">#{idx + 1}</span>
                    <Badge className={`text-xs ${difficultyColors[q.difficulty]}`}>{q.difficulty}</Badge>
                    {q.showAnswers && <span className="text-xs text-slate-500">· answers shown</span>}
                    {q.showExplanation && q.explanation && <span className="text-xs text-slate-500">· has explanation</span>}
                  </div>
                  <p className="text-white text-sm leading-relaxed line-clamp-2">{q.text}</p>
                  <div className="mt-3 space-y-1">
                    {q.options.map((opt) => (
                      <div key={opt.id} className={`flex items-center gap-2 text-xs ${opt.isCorrect ? "text-emerald-400" : "text-slate-500"}`}>
                        {opt.isCorrect
                          ? <CheckCircle className="h-3 w-3 flex-shrink-0" />
                          : <span className="w-3 h-3 flex-shrink-0 rounded-full border border-slate-600 inline-block" />}
                        <span className="line-clamp-1">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <AdminQuestionActions courseId={courseId} topicId={topicId} questionId={q.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
