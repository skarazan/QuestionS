"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function AdminQuestionActions({ courseId, topicId, questionId }) {
  const router = useRouter();

  async function deleteQuestion() {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(
      `/api/admin/courses/${courseId}/topics/${topicId}/questions/${questionId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Question deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete question");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-slate-500 hover:text-white p-1 rounded transition-colors flex-shrink-0">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#243447] border-slate-700 text-slate-300"
      >
        <DropdownMenuItem asChild>
          <Link
            href={`/admin/courses/${courseId}/topics/${topicId}/questions/${questionId}/edit`}
            className="cursor-pointer hover:text-white"
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          onClick={deleteQuestion}
          className="text-red-400 hover:text-red-300 cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
