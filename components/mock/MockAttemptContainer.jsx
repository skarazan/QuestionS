"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Timer,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";

function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function MockAttemptContainer({
  attemptId,
  courseSlug,
  topicSlug,
  mockTestId,
}) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local answer state keyed by questionId
  const [answers, setAnswers] = useState({}); // { [qid]: selectedOptionId }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [savingFor, setSavingFor] = useState(null); // qid being saved
  const [submitting, setSubmitting] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const autoSubmittedRef = useRef(false);

  // Load attempt state
  const loadAttempt = useCallback(async () => {
    const res = await fetch(`/api/mock-attempts/${attemptId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Failed to load attempt");
      setLoading(false);
      return null;
    }
    const json = await res.json();
    setData(json);
    const initial = {};
    for (const a of json.answers) {
      if (a.selectedOptionId) initial[a.questionId] = a.selectedOptionId;
    }
    setAnswers(initial);
    setLoading(false);
    return json;
  }, [attemptId]);

  const autoSubmit = useCallback(async () => {
    try {
      await fetch(`/api/mock-attempts/${attemptId}/submit`, { method: "POST" });
    } catch {
      /* ignore */
    }
    toast.warning("Time's up — attempt auto-submitted");
    await loadAttempt();
  }, [attemptId, loadAttempt]);

  // Keep latest autoSubmit in ref so timer effect doesn't need to re-bind
  const autoSubmitRef = useRef(autoSubmit);
  useEffect(() => {
    autoSubmitRef.current = autoSubmit;
  }, [autoSubmit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAttempt();
  }, [loadAttempt]);

  // Timer tick
  useEffect(() => {
    if (!data || data.completedAt) return;
    const deadline = new Date(data.deadlineAt).getTime();
    const tick = () => {
      const left = deadline - Date.now();
      setRemainingMs(left);
      if (left <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        autoSubmitRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  async function saveAnswer(qid, oid) {
    // Optimistic local update
    setAnswers((prev) => ({ ...prev, [qid]: oid }));
    setSavingFor(qid);
    try {
      const res = await fetch(`/api/mock-attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: qid, selectedOptionId: oid }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 410) {
          // deadline passed — force reload to show completed state
          toast.warning("Time's up — attempt auto-submitted");
          await loadAttempt();
          return;
        }
        toast.error(err.error || "Failed to save answer");
      }
    } catch {
      toast.error("Network error saving answer");
    } finally {
      setSavingFor(null);
    }
  }

  async function submit() {
    if (!confirm("Submit mock test? You will not be able to change your answers.")) return;
    setSubmitting(true);
    const res = await fetch(`/api/mock-attempts/${attemptId}/submit`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to submit");
      setSubmitting(false);
      return;
    }
    toast.success("Submitted");
    await loadAttempt();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">
        <Loader2 className="h-6 w-6 mx-auto animate-spin mb-3" />
        Loading attempt...
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-red-400">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const isCompleted = !!data.completedAt;
  const questions = data.questions;
  const current = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;

  if (isCompleted) {
    return (
      <MockResultsView
        data={data}
        answers={answers}
        courseSlug={courseSlug}
        topicSlug={topicSlug}
        mockTestId={mockTestId}
      />
    );
  }

  const timerClass =
    remainingMs < 60_000
      ? "text-red-400"
      : remainingMs < 5 * 60_000
      ? "text-amber-400"
      : "text-slate-200";

  return (
    <div className="w-full px-4 py-4 2xl:px-8">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur border-b border-slate-700 -mx-4 px-4 py-3 mb-4 2xl:-mx-8 2xl:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white font-semibold truncate">
              {data.mockTest.title}
            </h1>
            <div className="text-xs text-slate-500 mt-0.5">
              {answeredCount} / {data.totalQuestions} answered
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 font-mono text-lg ${timerClass}`}
            >
              <Timer className="h-4 w-4" />
              {formatDuration(remainingMs)}
            </div>
            <Button
              onClick={submit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
        {/* Question */}
        <div>
          <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
              <span className="font-mono">
                Q{currentIdx + 1} / {questions.length}
              </span>
              <span>·</span>
              <span>{current.difficulty}</span>
            </div>
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap mb-6">
              {current.text}
            </p>
            <div className="space-y-2">
              {current.options.map((opt, idx) => {
                const selected = answers[current.id] === opt.id;
                const letter = String.fromCharCode(65 + idx);
                return (
                  <button
                    key={opt.id}
                    onClick={() => saveAnswer(current.id, opt.id)}
                    disabled={savingFor === current.id}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      selected
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        selected
                          ? "bg-blue-500 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={currentIdx === questions.length - 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Navigator */}
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-3 h-fit lg:sticky lg:top-24">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2 px-1">
            Questions
          </div>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-1.5">
            {questions.map((q, i) => {
              const answered = !!answers[q.id];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`text-xs font-mono rounded py-1.5 transition-colors ${
                    isCurrent
                      ? "ring-2 ring-blue-500"
                      : ""
                  } ${
                    answered
                      ? "bg-blue-600/30 text-blue-200"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500 px-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600/30" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />{" "}
              Not answered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockResultsView({ data, answers, courseSlug, topicSlug, mockTestId }) {
  const questions = data.questions;
  const attemptAnswers = new Map(
    data.answers.map((a) => [a.questionId, a])
  );
  const correct = data.correctAnswers ?? 0;
  const total = data.totalQuestions;
  const score = data.scorePercentage ?? 0;

  const scoreColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-slate-400 text-sm mb-1">
              {data.mockTest.title}
            </div>
            {data.autoSubmitted && (
              <div className="inline-flex items-center gap-1 text-amber-400 text-xs mb-2">
                <AlertTriangle className="h-3 w-3" /> Auto-submitted on timeout
              </div>
            )}
            <div className={`text-4xl font-bold ${scoreColor}`}>{score}%</div>
            <div className="text-slate-400 text-sm mt-1">
              {correct} / {total} correct
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Link href={`/courses/${courseSlug}/${topicSlug}/mock-tests/${mockTestId}`}>
              Back to Mock Test
            </Link>
          </Button>
        </div>
      </div>

      <h2 className="text-white font-semibold mb-3">Review Answers</h2>
      <div className="space-y-3">
        {questions.map((q, idx) => {
          const ans = attemptAnswers.get(q.id);
          const selectedId = ans?.selectedOptionId;
          const correctOpt = q.options.find((o) => o.isCorrect);
          const isCorrect = ans?.isCorrect ?? false;
          return (
            <div
              key={q.id}
              className="bg-[#1f2937] border border-slate-700 rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 font-mono">Q{idx + 1}</span>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle className="h-3.5 w-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                      <XCircle className="h-3.5 w-3.5" /> Incorrect
                    </span>
                  )}
                </div>
              </div>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap mb-3">
                {q.text}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oidx) => {
                  const isSelected = selectedId === opt.id;
                  const isCorrectOpt = opt.isCorrect;
                  const letter = String.fromCharCode(65 + oidx);
                  let cls =
                    "bg-slate-800 border-slate-700 text-slate-400";
                  if (isCorrectOpt) {
                    cls = "bg-emerald-900/30 border-emerald-700 text-emerald-200";
                  } else if (isSelected && !isCorrectOpt) {
                    cls = "bg-red-900/30 border-red-700 text-red-200";
                  }
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-start gap-3 p-2.5 rounded border text-sm ${cls}`}
                    >
                      <span className="font-mono text-xs mt-0.5 w-4 flex-shrink-0">
                        {letter}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrectOpt && (
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {isSelected && !isCorrectOpt && (
                        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700 rounded text-slate-300 text-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                    Explanation
                  </div>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
