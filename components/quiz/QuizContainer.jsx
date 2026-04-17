"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, ChevronLeft, ChevronRight, Flag, Send, XCircle } from "lucide-react";

const difficultyColors = {
  EASY: "bg-emerald-900 text-emerald-300 border-emerald-700",
  MEDIUM: "bg-amber-900 text-amber-300 border-amber-700",
  HARD: "bg-red-900 text-red-300 border-red-700",
};

/**
 * UWorld-style practice quiz:
 * - Per-question submit: user selects → clicks "Submit Answer" → immediate feedback + explanation
 * - Locked after submit; free nav before submit
 * - Full-width layout on desktop; submit button at top
 */
export default function QuizContainer({ topic }) {
  const router = useRouter();
  const questions = topic.questions;

  // answerState[qId] = { selectedOptionId, submitted, isCorrect, correctOptionId, explanation }
  const [answerState, setAnswerState] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [starting, setStarting] = useState(true);
  const [submittingQ, setSubmittingQ] = useState(false);
  const [completing, setCompleting] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/quiz/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: topic.id }),
        });
        if (!res.ok) throw new Error("start failed");
        const data = await res.json();
        setAttemptId(data.attemptId);
      } catch {
        toast.error("Could not start quiz. Please reload.");
      } finally {
        setStarting(false);
      }
    })();
  }, [topic.id]);

  const current = questions[currentIdx];
  const currentState = answerState[current.id] || {};
  const submittedCount = Object.values(answerState).filter((s) => s.submitted).length;
  const progress = (submittedCount / questions.length) * 100;
  const allSubmitted = submittedCount === questions.length;

  function selectOption(qId, optionId) {
    if (answerState[qId]?.submitted) return;
    setAnswerState((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), selectedOptionId: optionId },
    }));
  }

  async function submitCurrent() {
    if (!attemptId || !currentState.selectedOptionId || currentState.submitted || submittingQ) return;
    setSubmittingQ(true);
    try {
      const res = await fetch(`/api/quiz/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          selectedOptionId: currentState.selectedOptionId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "submit failed");
      }
      const data = await res.json();
      setAnswerState((prev) => ({
        ...prev,
        [current.id]: {
          selectedOptionId: currentState.selectedOptionId,
          submitted: true,
          isCorrect: data.isCorrect,
          correctOptionId: data.correctOptionId,
          explanation: data.explanation,
        },
      }));
    } catch (err) {
      toast.error(typeof err?.message === "string" ? err.message : "Failed to submit answer");
    } finally {
      setSubmittingQ(false);
    }
  }

  async function finishQuiz() {
    if (!attemptId || completing) return;
    const remaining = questions.length - submittedCount;
    if (remaining > 0) {
      const ok = window.confirm(`${remaining} question${remaining > 1 ? "s" : ""} not answered. Finish anyway?`);
      if (!ok) return;
    }
    setCompleting(true);
    try {
      const res = await fetch(`/api/quiz/${attemptId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("complete failed");
      router.push(`/courses/${topic.course.slug}/${topic.slug}/results/${attemptId}`);
    } catch {
      toast.error("Could not finish quiz. Please try again.");
      setCompleting(false);
    }
  }

  if (starting) {
    return <div className="text-center text-slate-400 py-16">Loading quiz…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* TOP toolbar: title, progress, finish button */}
      <div className="flex items-center justify-between gap-4 bg-[#1e2a3a] border border-slate-700 rounded-lg px-4 py-3 sticky top-0 z-10 backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-white font-semibold truncate">{topic.title}</h1>
            <span className="text-slate-500 text-xs font-mono whitespace-nowrap">
              {submittedCount}/{questions.length} answered
            </span>
          </div>
          <Progress value={progress} className="h-1 bg-slate-700 [&>div]:bg-blue-500" />
        </div>
        <Button
          onClick={finishQuiz}
          disabled={completing || submittedCount === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
          size="sm"
        >
          <Flag className="h-3.5 w-3.5 mr-1.5" />
          {completing ? "Finishing…" : allSubmitted ? "View Results" : "Finish Quiz"}
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Question navigator */}
        <aside className="hidden md:flex flex-col gap-2 w-44 flex-shrink-0">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">Questions</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const s = answerState[q.id] || {};
              const isCurrent = idx === currentIdx;
              let cls = "bg-slate-700 text-slate-400 hover:bg-slate-600";
              if (s.submitted) {
                cls = s.isCorrect
                  ? "bg-emerald-800 text-emerald-100 border border-emerald-600"
                  : "bg-red-900 text-red-100 border border-red-700";
              } else if (s.selectedOptionId) {
                cls = "bg-blue-900 text-blue-200 border border-blue-700";
              }
              if (isCurrent) cls += " ring-2 ring-blue-400";
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-9 h-9 rounded text-xs font-mono font-medium transition-colors ${cls}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-800" /> Correct
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-900" /> Incorrect
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-900" /> Selected
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-slate-700" /> Unseen
            </div>
          </div>
        </aside>

        {/* Main question card */}
        <main className="flex-1 min-w-0 bg-[#243447] border border-slate-700 rounded-lg p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 text-sm font-mono">#{currentIdx + 1}</span>
              <Badge className={`text-xs border ${difficultyColors[current.difficulty]}`}>
                {current.difficulty}
              </Badge>
              {currentState.submitted && (
                <Badge
                  className={`text-xs border ${
                    currentState.isCorrect
                      ? "bg-emerald-900 text-emerald-200 border-emerald-700"
                      : "bg-red-900 text-red-200 border-red-700"
                  }`}
                >
                  {currentState.isCorrect ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" /> Correct
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" /> Incorrect
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          <p className="text-white text-base md:text-lg leading-relaxed mb-6 whitespace-pre-wrap">
            {current.text}
          </p>

          <div className="space-y-2 mb-5">
            {current.options.map((option, optIdx) => {
              const letters = ["A", "B", "C", "D", "E", "F"];
              const selected = currentState.selectedOptionId === option.id;
              const isCorrect = currentState.submitted && currentState.correctOptionId === option.id;
              const isWrongSelected =
                currentState.submitted && selected && !currentState.isCorrect;

              let cls = "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-400 hover:text-white";
              if (currentState.submitted) {
                if (isCorrect) cls = "border-emerald-500 bg-emerald-900/40 text-emerald-100";
                else if (isWrongSelected) cls = "border-red-500 bg-red-900/40 text-red-100";
                else cls = "border-slate-700 bg-slate-800/20 text-slate-500";
              } else if (selected) {
                cls = "border-blue-500 bg-blue-900/40 text-white";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => selectOption(current.id, option.id)}
                  disabled={currentState.submitted}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-start gap-3 disabled:cursor-default ${cls}`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-medium flex items-center justify-center mt-0.5 ${
                      selected
                        ? "border-blue-400 bg-blue-600 text-white"
                        : isCorrect
                        ? "border-emerald-400 bg-emerald-600 text-white"
                        : "border-slate-500 text-slate-400"
                    }`}
                  >
                    {letters[optIdx]}
                  </span>
                  <span className="leading-relaxed flex-1">{option.text}</span>
                  {currentState.submitted && isCorrect && (
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  )}
                  {currentState.submitted && isWrongSelected && (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {currentState.submitted && currentState.explanation && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-5">
              <p className="text-slate-300 text-sm uppercase tracking-wider font-semibold mb-2">
                Explanation
              </p>
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {currentState.explanation}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            {!currentState.submitted ? (
              <Button
                onClick={submitCurrent}
                disabled={!currentState.selectedOptionId || submittingQ}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {submittingQ ? "Submitting…" : "Submit Answer"}
              </Button>
            ) : currentIdx < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Next Question <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={finishQuiz}
                disabled={completing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                <Flag className="h-3.5 w-3.5 mr-1.5" />
                {completing ? "Finishing…" : "View Results"}
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
