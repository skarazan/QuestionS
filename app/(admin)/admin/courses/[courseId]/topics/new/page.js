import TopicForm from "@/components/admin/TopicForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewTopicPage({ params }) {
  const { courseId } = await params;
  return (
    <div>
      <Link href={`/admin/courses/${courseId}`} className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">New Topic</h1>
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <TopicForm courseId={courseId} />
      </div>
    </div>
  );
}
