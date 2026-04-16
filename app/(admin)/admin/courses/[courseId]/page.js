import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminTopicActions from "@/components/admin/AdminTopicActions";
import { Plus, Pencil } from "lucide-react";

async function getCourse(courseId) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      topics: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });
}

export default async function AdminCoursePage({ params }) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/courses" className="text-slate-400 hover:text-white text-sm transition-colors">Courses</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 text-sm">{course.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <Badge className={course.isPublished ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-400"}>
              {course.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          {course.description && <p className="text-slate-400 mt-1">{course.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Link href={`/admin/courses/${courseId}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Course
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/admin/courses/${courseId}/topics/new`}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Topic
            </Link>
          </Button>
        </div>
      </div>

      {course.topics.length === 0 ? (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-500 mb-4">No topics yet.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/admin/courses/${courseId}/topics/new`}>Add First Topic</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Topic</th>
                <th className="text-center px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Questions</th>
                <th className="text-center px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {course.topics.map((topic) => (
                <tr key={topic.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/courses/${courseId}/topics/${topic.id}`} className="text-white font-medium hover:text-blue-400 transition-colors">
                      {topic.title}
                    </Link>
                    {topic.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{topic.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-center"><span className="text-slate-400">{topic._count.questions}</span></td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={topic.isPublished ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-400"}>
                      {topic.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AdminTopicActions courseId={courseId} topicId={topic.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
