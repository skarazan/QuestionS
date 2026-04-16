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

export default function CourseForm({ course }) {
  const router = useRouter();
  const isEdit = !!course;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(course?.title || "");
  const [slug, setSlug] = useState(course?.slug || "");
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
      imageUrl: form.get("imageUrl") || "",
      order: parseInt(form.get("order") || "0"),
      isPublished: form.get("isPublished") === "on",
    };

    const url = isEdit ? `/api/admin/courses/${course.id}` : "/api/admin/courses";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(isEdit ? "Course updated" : "Course created");
      router.push("/admin/courses");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save course");
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
          placeholder="e.g. USMLE Step 1"
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
          placeholder="usmle-step-1"
          className="mt-1 bg-slate-800 border-slate-600 text-white font-mono"
        />
        <p className="text-slate-500 text-xs mt-1">
          Used in URLs. Only lowercase letters, numbers, and hyphens.
        </p>
      </div>

      <div>
        <Label className="text-slate-300">Description</Label>
        <Textarea
          name="description"
          defaultValue={course?.description || ""}
          placeholder="Brief course description..."
          rows={3}
          className="mt-1 bg-slate-800 border-slate-600 text-white resize-none"
        />
      </div>

      <div>
        <Label className="text-slate-300">Image URL</Label>
        <Input
          name="imageUrl"
          type="url"
          defaultValue={course?.imageUrl || ""}
          placeholder="https://..."
          className="mt-1 bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Display Order</Label>
        <Input
          name="order"
          type="number"
          defaultValue={course?.order ?? 0}
          min={0}
          className="mt-1 bg-slate-800 border-slate-600 text-white w-32"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          name="isPublished"
          id="isPublished"
          defaultChecked={course?.isPublished || false}
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
          {loading ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
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
