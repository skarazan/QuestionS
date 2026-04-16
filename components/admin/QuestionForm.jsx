"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";

const defaultOption = () => ({ text: "", isCorrect: false });

export default function QuestionForm({ courseId, topicId, question }) {
  const router = useRouter();
  const isEdit = !!question;
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState(question?.difficulty || "MEDIUM");
  const [showExplanation, setShowExplanation] = useState(
    question?.showExplanation ?? true
  );
  const [showAnswers, setShowAnswers] = useState(question?.showAnswers ?? true);
  const [options, setOptions] = useState(
    question?.options?.length > 0
      ? question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [defaultOption(), defaultOption(), defaultOption(), defaultOption()]
  );

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, defaultOption()]);
  }

  function removeOption(idx) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  function updateOption(idx, field, value) {
    setOptions(
      options.map((o, i) => (i === idx ? { ...o, [field]: value } : o))
    );
  }

  function setCorrect(idx) {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.target);

    // Validate: at least one correct
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      toast.error("Exactly one option must be marked as correct");
      setLoading(false);
      return;
    }
    if (options.some((o) => !o.text.trim())) {
      toast.error("All options must have text");
      setLoading(false);
      return;
    }

    const data = {
      text: form.get("text"),
      explanation: form.get("explanation") || undefined,
      difficulty,
      showExplanation,
      showAnswers,
      order: parseInt(form.get("order") || "0"),
      options: options.map((o, idx) => ({ ...o, order: idx })),
    };

    const url = isEdit
      ? `/api/admin/courses/${courseId}/topics/${topicId}/questions/${question.id}`
      : `/api/admin/courses/${courseId}/topics/${topicId}/questions`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(isEdit ? "Question updated" : "Question created");
      router.push(`/admin/courses/${courseId}/topics/${topicId}`);
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save question");
      setLoading(false);
    }
  }

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Question text */}
      <div>
        <Label className="text-slate-300">Question Text *</Label>
        <Textarea
          name="text"
          required
          defaultValue={question?.text || ""}
          placeholder="Enter the question..."
          rows={4}
          className="mt-1 bg-slate-800 border-slate-600 text-white resize-none"
        />
      </div>

      {/* Difficulty + Order */}
      <div className="flex gap-4">
        <div className="w-48">
          <Label className="text-slate-300">Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 text-white">
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Label className="text-slate-300">Display Order</Label>
          <Input
            name="order"
            type="number"
            defaultValue={question?.order ?? 0}
            min={0}
            className="mt-1 bg-slate-800 border-slate-600 text-white"
          />
        </div>
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-slate-300">
            Answer Options * (click radio to mark correct)
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOption}
            disabled={options.length >= 6}
            className="text-slate-400 hover:text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
          </Button>
        </div>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {/* Correct radio */}
              <button
                type="button"
                onClick={() => setCorrect(idx)}
                className="mt-2.5 flex-shrink-0 focus:outline-none"
                title="Mark as correct answer"
              >
                {opt.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                )}
              </button>
              {/* Letter label */}
              <span className="text-slate-500 text-sm font-mono mt-2.5 w-5 flex-shrink-0">
                {letters[idx]}
              </span>
              {/* Text input */}
              <Input
                value={opt.text}
                onChange={(e) => updateOption(idx, "text", e.target.value)}
                placeholder={`Option ${letters[idx]}`}
                className={`flex-1 bg-slate-800 border-slate-600 text-white ${
                  opt.isCorrect ? "border-emerald-600" : ""
                }`}
              />
              {/* Remove */}
              <button
                type="button"
                onClick={() => removeOption(idx)}
                disabled={options.length <= 2}
                className="mt-2.5 text-slate-600 hover:text-red-400 disabled:opacity-30 flex-shrink-0 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Click the circle icon to mark the correct answer. Minimum 2, maximum 6 options.
        </p>
      </div>

      {/* Explanation */}
      <div>
        <Label className="text-slate-300">Explanation (optional)</Label>
        <Textarea
          name="explanation"
          defaultValue={question?.explanation || ""}
          placeholder="Explain why this answer is correct..."
          rows={3}
          className="mt-1 bg-slate-800 border-slate-600 text-white resize-none"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="showAnswers"
            checked={showAnswers}
            onCheckedChange={setShowAnswers}
            className="border-slate-600"
          />
          <Label htmlFor="showAnswers" className="text-slate-300 cursor-pointer">
            Show correct answer after submission
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="showExplanation"
            checked={showExplanation}
            onCheckedChange={setShowExplanation}
            className="border-slate-600"
          />
          <Label htmlFor="showExplanation" className="text-slate-300 cursor-pointer">
            Show explanation after submission (if provided)
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Saving..." : isEdit ? "Update Question" : "Create Question"}
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
