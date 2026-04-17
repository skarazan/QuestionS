import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import MockTestForm from "@/components/admin/MockTestForm";
import { ArrowLeft } from "lucide-react";

async function getData(topicId, mockTestId) {
  const [topic, mockTest] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, text: true, difficulty: true },
        },
      },
    }),
    prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: { questionId: true },
        },
      },
    }),
  ]);
  return { topic, mockTest };
}

export default async function EditMockTestPage({ params }) {
  const { courseId, topicId, mockTestId } = await params;
  const { topic, mockTest } = await getData(topicId, mockTestId);
  if (!topic || !mockTest || mockTest.topicId !== topicId) notFound();

  return (
    <div>
      <Link
        href={`/admin/courses/${courseId}/topics/${topicId}`}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Topic
      </Link>
      <h1 className="text-2xl font-bold text-white mb-1">Edit Mock Test</h1>
      <p className="text-slate-500 text-sm mb-6">{mockTest.title}</p>
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <MockTestForm
          courseId={courseId}
          topicId={topicId}
          topicQuestions={topic.questions}
          mockTest={mockTest}
        />
      </div>
    </div>
  );
}
