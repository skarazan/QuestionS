import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}
