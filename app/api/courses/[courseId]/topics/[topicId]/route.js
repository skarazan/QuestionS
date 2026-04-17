import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(req, { params }) {
  try {
    const { topicId } = await params;
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
              select: { id: true, text: true, order: true },
            },
          },
        },
      },
    });
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(topic);
  } catch (err) {
    logger.error("topic_get_failed", err, { path: "/api/courses/[id]/topics/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
