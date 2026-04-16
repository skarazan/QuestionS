import Link from "next/link";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminCourseActions from "@/components/admin/AdminCourseActions";
import { Plus } from "lucide-react";

async function getCourses() {
  return prisma.course.findMany({
    include: { _count: { select: { topics: true } } },
    orderBy: { order: "asc" },
  });
}

export default async function AdminCoursesPage() {
  const courses = await getCourses();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4 mr-1.5" /> New Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-slate-500 mb-4">No courses yet.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/admin/courses/new">Create First Course</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-[#1f2937] border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">
                  Course
                </th>
                <th className="text-left px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                  Slug
                </th>
                <th className="text-center px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">
                  Topics
                </th>
                <th className="text-center px-6 py-3 text-slate-500 text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="text-white font-medium hover:text-blue-400 transition-colors"
                    >
                      {course.title}
                    </Link>
                    {course.description && (
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                        {course.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <code className="text-slate-400 text-sm">{course.slug}</code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-slate-400">{course._count.topics}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge
                      className={
                        course.isPublished
                          ? "bg-emerald-900 text-emerald-300"
                          : "bg-slate-700 text-slate-400"
                      }
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <AdminCourseActions courseId={course.id} />
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
