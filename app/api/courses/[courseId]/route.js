import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req, { params }) {
  try {
    const { courseId } = await params;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: { _count: { select: { questions: true } } },
        },
      },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(course);
  } catch (err) {
    logger.error("course_get_failed", err, { path: "/api/courses/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
