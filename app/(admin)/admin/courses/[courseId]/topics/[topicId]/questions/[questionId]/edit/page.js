import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import QuestionForm from "@/components/admin/QuestionForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditQuestionPage({ params }) {
  const { courseId, topicId, questionId } = await params;
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });
  if (!question) notFound();

  return (
    <div>
      <Link
        href={`/admin/courses/${courseId}/topics/${topicId}`}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Topic
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Question</h1>
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <QuestionForm
          courseId={courseId}
          topicId={topicId}
          question={question}
        />
      </div>
    </div>
  );
}
