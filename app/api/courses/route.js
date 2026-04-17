import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/courses — list all published courses (public)
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        _count: { select: { topics: true } },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(courses);
  } catch (err) {
    logger.error("courses_list_failed", err, { path: "/api/courses" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
