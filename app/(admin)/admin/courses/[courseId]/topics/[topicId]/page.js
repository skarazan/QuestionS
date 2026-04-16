import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminQuestionActions from "@/components/admin/AdminQuestionActions";
import { ArrowLeft, Plus, Pencil, CheckCircle } from "lucide-react";

async function getTopic(topicId) {
  return prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
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
  const topic = await getTopic(params.topicId);
  if (!topic) notFound();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin/courses" className="text-slate-400 hover:text-white">Courses</Link>
        <span className="text-slate-600">/</span>
        <Link href={`/admin/courses/${topic.course.id}`} className="text-slate-400 hover:text-white">
          {topic.course.title}
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300">{topic.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
            <Badge
              className={
                topic.isPublished
                  ? "bg-emerald-900 text-emerald-300"
                  : "bg-slate-700 text-slate-400"
              }
            >
              {topic.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          {topic.description && (
            <p className="text-slate-400 mt-1">{topic.description}</p>
          )}
          <p className="text-slate-500 text-sm mt-1">
            {topic.questions.length} question{topic.questions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Link href={`/admin/courses/${params.courseId}/topics/${topic.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Topic
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/admin/courses/${params.courseId}/topics/${topic.id}/questions/new`}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Question
            </Link>
          </Button>
        </div>
      </div>

      {topic.questions.length === 0 ? (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-500 mb-4">No questions yet.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/admin/courses/${params.courseId}/topics/${topic.id}/questions/new`}>
              Add First Question
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {topic.questions.map((q, idx) => {
            const correctOption = q.options.find((o) => o.isCorrect);
            return (
              <div
                key={q.id}
                className="bg-[#1f2937] border border-slate-700 rounded-lg p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-slate-500 text-xs font-mono">
                        #{idx + 1}
                      </span>
                      <Badge className={`text-xs ${difficultyColors[q.difficulty]}`}>
                        {q.difficulty}
                      </Badge>
                      {q.showAnswers && (
                        <span className="text-xs text-slate-500">· answers shown</span>
                      )}
                      {q.showExplanation && q.explanation && (
                        <span className="text-xs text-slate-500">· has explanation</span>
                      )}
                    </div>
                    <p className="text-white text-sm leading-relaxed line-clamp-2">
                      {q.text}
                    </p>
                    {/* Options preview */}
                    <div className="mt-3 space-y-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 text-xs ${
                            opt.isCorrect ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {opt.isCorrect ? (
                            <CheckCircle className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <span className="w-3 h-3 flex-shrink-0 rounded-full border border-slate-600 inline-block" />
                          )}
                          <span className="line-clamp-1">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <AdminQuestionActions
                    courseId={params.courseId}
                    topicId={topic.id}
                    questionId={q.id}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
