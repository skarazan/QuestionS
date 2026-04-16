"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Circle, ChevronLeft, ChevronRight, Send } from "lucide-react";

const difficultyColors = {
  EASY: "bg-emerald-900 text-emerald-300 border-emerald-700",
  MEDIUM: "bg-amber-900 text-amber-300 border-amber-700",
  HARD: "bg-red-900 text-red-300 border-red-700",
};

export default function QuizContainer({ topic }) {
  const router = useRouter();
  const [answers, setAnswers] = useState({}); // { questionId: optionId }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const questions = topic.questions;
  const current = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const progress = (answered / questions.length) * 100;

  function selectOption(questionId, optionId) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    if (answered < questions.length) {
      const unanswered = questions.length - answered;
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const payload = {
        topicId: topic.id,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id] ?? null,
        })),
      };

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const { attemptId } = await res.json();
      router.push(
        `/courses/${topic.course.slug}/${topic.slug}/results/${attemptId}`
      );
    } catch (err) {
      toast.error("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar: question navigator */}
      <div className="hidden lg:flex flex-col gap-1 w-48 flex-shrink-0">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-medium">
          Questions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-9 h-9 rounded text-xs font-mono font-medium transition-colors ${
                idx === currentIdx
                  ? "bg-blue-600 text-white"
                  : answers[q.id]
                  ? "bg-emerald-800 text-emerald-200 border border-emerald-700"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-800 border border-emerald-700" />
            Answered
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
            Current
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-700" />
            Unanswered
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {submitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      </div>

      {/* Main question area */}
      <div className="flex-1 min-w-0">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>
              {answered}/{questions.length} answered
            </span>
            <span>Question {currentIdx + 1} of {questions.length}</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-slate-700 [&>div]:bg-blue-500" />
        </div>

        {/* Question card */}
        <div className="bg-[#243447] border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm font-mono">
                #{currentIdx + 1}
              </span>
              <Badge
                className={`text-xs border ${difficultyColors[current.difficulty]}`}
              >
                {current.difficulty}
              </Badge>
            </div>
            {answers[current.id] && (
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            )}
          </div>

          <p className="text-white text-base leading-relaxed mb-6 whitespace-pre-wrap">
            {current.text}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {current.options.map((option, optIdx) => {
              const selected = answers[current.id] === option.id;
              const letters = ["A", "B", "C", "D", "E", "F"];
              return (
                <button
                  key={option.id}
                  onClick={() => selectOption(current.id, option.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-start gap-3 group ${
                    selected
                      ? "border-blue-500 bg-blue-900/40 text-white"
                      : "border-slate-600 bg-slate-800/40 text-slate-300 hover:border-slate-400 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-medium flex items-center justify-center mt-0.5 ${
                      selected
                        ? "border-blue-400 bg-blue-600 text-white"
                        : "border-slate-500 text-slate-400 group-hover:border-slate-300"
                    }`}
                  >
                    {letters[optIdx]}
                  </span>
                  <span className="leading-relaxed">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="text-slate-400 hover:text-white"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>

        {/* Mobile submit */}
        <div className="lg:hidden mt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? "Submitting..." : `Submit (${answered}/${questions.length} answered)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
