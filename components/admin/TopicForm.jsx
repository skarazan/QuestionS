"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function TopicForm({ courseId, topic }) {
  const router = useRouter();
  const isEdit = !!topic;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(topic?.title || "");
  const [slug, setSlug] = useState(topic?.slug || "");
  const [slugEdited, setSlugEdited] = useState(isEdit);

  function handleTitleChange(e) {
    setTitle(e.target.value);
    if (!slugEdited) setSlug(slugify(e.target.value));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);

    const data = {
      title: form.get("title"),
      description: form.get("description"),
      slug: form.get("slug"),
      order: parseInt(form.get("order") || "0"),
      isPublished: form.get("isPublished") === "on",
    };

    const url = isEdit
      ? `/api/admin/courses/${courseId}/topics/${topic.id}`
      : `/api/admin/courses/${courseId}/topics`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(isEdit ? "Topic updated" : "Topic created");
      router.push(`/admin/courses/${courseId}`);
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save topic");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div>
        <Label className="text-slate-300">Title *</Label>
        <Input
          name="title"
          required
          value={title}
          onChange={handleTitleChange}
          placeholder="e.g. Biochemistry"
          className="mt-1 bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Slug *</Label>
        <Input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          placeholder="biochemistry"
          className="mt-1 bg-slate-800 border-slate-600 text-white font-mono"
        />
        <p className="text-slate-500 text-xs mt-1">
          Must be unique within this course.
        </p>
      </div>

      <div>
        <Label className="text-slate-300">Description</Label>
        <Textarea
          name="description"
          defaultValue={topic?.description || ""}
          placeholder="Brief topic description..."
          rows={3}
          className="mt-1 bg-slate-800 border-slate-600 text-white resize-none"
        />
      </div>

      <div>
        <Label className="text-slate-300">Display Order</Label>
        <Input
          name="order"
          type="number"
          defaultValue={topic?.order ?? 0}
          min={0}
          className="mt-1 bg-slate-800 border-slate-600 text-white w-32"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          name="isPublished"
          id="isPublished"
          defaultChecked={topic?.isPublished || false}
          className="border-slate-600"
        />
        <Label htmlFor="isPublished" className="text-slate-300 cursor-pointer">
          Published (visible to students)
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Saving..." : isEdit ? "Update Topic" : "Create Topic"}
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
