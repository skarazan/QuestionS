import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTopicPercentile, getCoursePercentile } from "@/lib/percentile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  ArrowLeft,
  Trophy,
  RotateCcw,
} from "lucide-react";

async function getAttempt(attemptId, userId) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      topic: {
        include: {
          course: { select: { id: true, title: true, slug: true } },
        },
      },
      answers: {
        include: {
          question: {
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  if (!attempt || attempt.userId !== userId) return null;
  return attempt;
}

export default async function ResultsPage({ params }) {
  const session = await auth();
  if (!session) redirect("/login");

  const attempt = await getAttempt(params.attemptId, session.user.id);
  if (!attempt) notFound();

  const topic = attempt.topic;
  const course = topic.course;

  const topicPercentile = await getTopicPercentile(
    topic.id,
    attempt.scorePercentage ?? 0
  );
  const coursePercentile = await getCoursePercentile(course.id, session.user.id);

  const score = attempt.scorePercentage ?? 0;
  const scoreColor =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  const difficultyColors = {
    EASY: "bg-emerald-900 text-emerald-300 border-emerald-700",
    MEDIUM: "bg-amber-900 text-amber-300 border-amber-700",
    HARD: "bg-red-900 text-red-300 border-red-700",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href={`/courses/${course.slug}/${topic.slug}`}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {topic.title}
      </Link>

      {/* Score summary */}
      <div className="bg-[#243447] border border-slate-700 rounded-xl p-8 mb-6 text-center">
        <Trophy className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h1 className="text-white text-2xl font-bold mb-1">Quiz Complete</h1>
        <p className="text-slate-400 text-sm mb-6">{topic.title}</p>

        <div className={`text-7xl font-bold mb-2 ${scoreColor}`}>{Math.round(score)}%</div>
        <p className="text-slate-400 text-sm">
          {attempt.correctAnswers} correct out of {attempt.totalQuestions} questions
        </p>

        <div className="mt-4 max-w-xs mx-auto">
          <Progress
            value={score}
            className="h-2 bg-slate-700 [&>div]:bg-blue-500"
          />
        </div>

        {/* Percentile cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-500 text-xs mb-1">Topic Percentile</p>
            <p className="text-white text-2xl font-bold">
              {topicPercentile !== null ? `${topicPercentile}th` : "—"}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {topicPercentile !== null
                ? `Better than ${topicPercentile}% of test takers`
                : "First attempt!"}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-500 text-xs mb-1">Course Percentile</p>
            <p className="text-white text-2xl font-bold">
              {coursePercentile !== null ? `${coursePercentile}th` : "—"}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {coursePercentile !== null
                ? `Among all ${course.title} students`
                : "First attempt!"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Link href={`/courses/${course.slug}`}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Course
            </Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/courses/${course.slug}/${topic.slug}`}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Retry
            </Link>
          </Button>
        </div>
      </div>

      {/* Per-question review */}
      <h2 className="text-white font-semibold text-lg mb-4">Question Review</h2>
      <div className="space-y-4">
        {attempt.answers.map((a, idx) => {
          const q = a.question;
          const letters = ["A", "B", "C", "D", "E", "F"];

          return (
            <div
              key={a.id}
              className={`bg-[#243447] border rounded-lg p-5 ${
                a.isCorrect
                  ? "border-emerald-800"
                  : a.selectedOptionId === null
                  ? "border-slate-700"
                  : "border-red-900"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 mt-0.5">
                  {a.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : a.selectedOptionId === null ? (
                    <MinusCircle className="h-5 w-5 text-slate-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-500 text-xs">Q{idx + 1}</span>
                    <Badge
                      className={`text-xs border ${difficultyColors[q.difficulty]}`}
                    >
                      {q.difficulty}
                    </Badge>
                  </div>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {q.text}
                  </p>
                </div>
              </div>

              {q.showAnswers && (
                <div className="space-y-1.5 ml-8">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = a.selectedOptionId === opt.id;
                    const isCorrect = opt.isCorrect;
                    let cls =
                      "px-3 py-2 rounded border text-sm flex items-center gap-2 ";
                    if (isCorrect) {
                      cls +=
                        "border-emerald-700 bg-emerald-900/30 text-emerald-300";
                    } else if (isSelected && !isCorrect) {
                      cls += "border-red-700 bg-red-900/30 text-red-300";
                    } else {
                      cls += "border-slate-700 text-slate-400";
                    }

                    return (
                      <div key={opt.id} className={cls}>
                        <span className="font-mono text-xs w-4 flex-shrink-0">
                          {letters[optIdx]}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrect && (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        )}
                        {isSelected && !isCorrect && (
                          <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.showExplanation && q.explanation && (
                <div className="mt-3 ml-8 bg-slate-800 border border-slate-700 rounded p-3">
                  <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">
                    Explanation
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
