"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

export default function AdminTopicActions({ courseId, topicId }) {
  const router = useRouter();

  async function deleteTopic() {
    if (!confirm("Delete this topic? All questions will be removed.")) return;
    const res = await fetch(
      `/api/admin/courses/${courseId}/topics/${topicId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Topic deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete topic");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-slate-500 hover:text-white p-1 rounded transition-colors bg-transparent border-0 cursor-pointer">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#243447] border-slate-700 text-slate-300"
      >
        <DropdownMenuItem
          onClick={() => router.push(`/admin/courses/${courseId}/topics/${topicId}`)}
          className="cursor-pointer hover:text-white"
        >
          <Eye className="h-4 w-4 mr-2" /> Manage Questions
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/admin/courses/${courseId}/topics/${topicId}/edit`)}
          className="cursor-pointer hover:text-white"
        >
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          onClick={deleteTopic}
          className="text-red-400 hover:text-red-300 cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
