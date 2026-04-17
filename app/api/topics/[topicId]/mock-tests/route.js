import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/topics/[topicId]/mock-tests — public list of published mock tests for a topic
export async function GET(req, { params }) {
  try {
    const { topicId } = await params;
    const mocks = await prisma.mockTest.findMany({
      where: { topicId, isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        _count: { select: { questions: true } },
      },
    });
    return NextResponse.json(mocks);
  } catch (err) {
    logger.error("topic_mock_list_failed", err, { path: "/api/topics/[id]/mock-tests" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
