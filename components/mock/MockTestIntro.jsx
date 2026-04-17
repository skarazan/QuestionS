"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Timer, AlertTriangle, Play, RotateCcw } from "lucide-react";

export default function MockTestIntro({
  mockTest,
  existingAttempt,
  courseSlug,
  topicSlug,
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const hasCompleted = existingAttempt?.completedAt;
  const hasActive =
    existingAttempt &&
    !existingAttempt.completedAt &&
    new Date(existingAttempt.deadlineAt) > new Date();

  async function startAttempt() {
    setStarting(true);
    const res = await fetch(`/api/mock-tests/${mockTest.id}/start`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to start mock test");
      setStarting(false);
      return;
    }
    const { attemptId } = await res.json();
    router.push(
      `/courses/${courseSlug}/${topicSlug}/mock-tests/${mockTest.id}/attempts/${attemptId}`
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">{mockTest.title}</h1>
      {mockTest.description && (
        <p className="text-slate-400 mb-6">{mockTest.description}</p>
      )}

      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">
              Duration
            </div>
            <div className="flex items-center gap-2 text-white text-lg font-semibold">
              <Timer className="h-4 w-4 text-blue-400" />
              {mockTest.durationMinutes} minutes
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wide mb-1">
              Questions
            </div>
            <div className="text-white text-lg font-semibold">
              {mockTest.questionCount}
            </div>
          </div>
        </div>

        <div className="bg-amber-950/40 border border-amber-900/60 rounded p-3 flex gap-2 text-amber-200 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Exam mode:</strong> once you start, the timer runs until
            duration ends. Auto-submits on timeout. You can navigate freely
            between questions, but correct answers and explanations stay hidden
            until you submit or time expires.
          </div>
        </div>
      </div>

      {hasCompleted && (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">
                Previous attempt {existingAttempt.autoSubmitted && "(auto-submitted)"}
              </div>
              <div className="text-2xl font-bold text-white">
                {existingAttempt.scorePercentage}%
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Link
                href={`/courses/${courseSlug}/${topicSlug}/mock-tests/${mockTest.id}/attempts/${existingAttempt.id}`}
              >
                View Results
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {hasActive ? (
          <Button
            onClick={startAttempt}
            disabled={starting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {starting ? "Resuming..." : "Resume Attempt"}
          </Button>
        ) : (
          <Button
            onClick={startAttempt}
            disabled={starting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            {starting ? "Starting..." : hasCompleted ? "Start New Attempt" : "Start Mock Test"}
          </Button>
        )}
      </div>
    </div>
  );
}
