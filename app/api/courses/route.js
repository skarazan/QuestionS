import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
