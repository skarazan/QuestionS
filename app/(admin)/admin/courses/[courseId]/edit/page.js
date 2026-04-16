import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CourseForm from "@/components/admin/CourseForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditCoursePage({ params }) {
  const { courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) notFound();

  return (
    <div>
      <Link href="/admin/courses" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Course</h1>
      <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-6">
        <CourseForm course={course} />
      </div>
    </div>
  );
}
