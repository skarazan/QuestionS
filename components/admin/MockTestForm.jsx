"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle, Circle, Timer } from "lucide-react";

export default function MockTestForm({
  courseId,
  topicId,
  topicQuestions, // [{ id, text, difficulty }]
  mockTest, // optional existing mock test for edit mode
}) {
  const router = useRouter();
  const isEdit = !!mockTest;
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(mockTest?.title || "");
  const [description, setDescription] = useState(mockTest?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(
    mockTest?.durationMinutes ?? 60
  );
  const [isPublished, setIsPublished] = useState(mockTest?.isPublished ?? false);
  const [selectedIds, setSelectedIds] = useState(
    new Set(
      mockTest?.questions?.map((mq) => mq.questionId ?? mq.question?.id) ?? []
    )
  );

  function toggleQuestion(qid) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(topicQuestions.map((q) => q.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (selectedIds.size === 0) {
      toast.error("Select at least 1 question");
      return;
    }
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    const dur = parseInt(durationMinutes);
    if (!Number.isFinite(dur) || dur < 1 || dur > 600) {
      toast.error("Duration must be 1–600 minutes");
      return;
    }

    setLoading(true);

    // Preserve display order of topic.questions
    const questionIds = topicQuestions
      .filter((q) => selectedIds.has(q.id))
      .map((q) => q.id);

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes: dur,
      isPublished,
      questionIds,
    };

    const url = isEdit
      ? `/api/admin/mock-tests/${mockTest.id}`
      : `/api/admin/topics/${topicId}/mock-tests`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(isEdit ? "Mock test updated" : "Mock test created");
      router.push(`/admin/courses/${courseId}/topics/${topicId}`);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      const msg =
        typeof err.error === "string"
          ? err.error
          : "Failed to save mock test";
      toast.error(msg);
      setLoading(false);
    }
  }

  const difficultyColors = {
    EASY: "text-emerald-400",
    MEDIUM: "text-amber-400",
    HARD: "text-red-400",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <Label className="text-slate-300">Title *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Midterm Mock Exam"
          className="mt-1 bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Instructions shown before students begin..."
          className="mt-1 bg-slate-800 border-slate-600 text-white resize-none"
        />
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <Label className="text-slate-300 flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> Duration (minutes) *
          </Label>
          <Input
            type="number"
            min={1}
            max={600}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
            className="mt-1 bg-slate-800 border-slate-600 text-white"
          />
        </div>
        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
              className="border-slate-600"
            />
            <Label htmlFor="isPublished" className="text-slate-300 cursor-pointer">
              Published (visible to students)
            </Label>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-slate-300">
            Questions * ({selectedIds.size} / {topicQuestions.length} selected)
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-slate-400 hover:text-white text-xs"
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-slate-400 hover:text-white text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        {topicQuestions.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center text-slate-500 text-sm">
            No questions exist in this topic yet. Add questions before creating a mock test.
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-h-96 overflow-y-auto">
            {topicQuestions.map((q, idx) => {
              const checked = selectedIds.has(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleQuestion(q.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/40 transition-colors ${
                    checked ? "bg-slate-700/30" : ""
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {checked ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-500 text-xs font-mono">
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-xs ${difficultyColors[q.difficulty]}`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm line-clamp-2">
                      {q.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || topicQuestions.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Saving..." : isEdit ? "Update Mock Test" : "Create Mock Test"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
