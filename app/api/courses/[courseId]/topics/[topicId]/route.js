import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/courses/[courseId]/topics/[topicId] — topic + questions (public, published)
export async function GET(req, { params }) {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: params.topicId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        questions: {
          where: {},
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
              select: { id: true, text: true, order: true },
              // Never expose isCorrect to public quiz endpoint
            },
          },
        },
      },
    });
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(topic);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 });
  }
}
