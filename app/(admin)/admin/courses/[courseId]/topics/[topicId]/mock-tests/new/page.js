import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import MockTestForm from "@/components/admin/MockTestForm";
import { ArrowLeft } from "lucide-react";

async function getTopicQuestions(topicId) {
  return prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, difficulty: true },
      },
    },
  });
}

export default async function NewMockTestPage({ params }) {
  const { courseId, topicId } = await params;
  const topic = await getTopicQuestions(topicId);
  if (!topic) notFound();

  return (
    <div>
      <Link
        href={`/admin/courses/${courseId}/topics/${topicId}`}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Topic
      </Link>
      <h1 className="text-2xl font-bold text-white mb-1">New Mock Test</h1>
      <p className="text-slate-500 text-sm mb-6">
        Timed exam assembled from this topic&apos;s question bank.
      </p>
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <MockTestForm
          courseId={courseId}
          topicId={topicId}
          topicQuestions={topic.questions}
        />
      </div>
    </div>
  );
}
