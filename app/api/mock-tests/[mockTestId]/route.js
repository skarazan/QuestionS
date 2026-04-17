import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/mock-tests/[mockTestId] — public metadata only
export async function GET(req, { params }) {
  try {
    const { mockTestId } = await params;
    const mock = await prisma.mockTest.findFirst({
      where: { id: mockTestId, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        topic: { select: { id: true, title: true, slug: true, course: { select: { slug: true } } } },
        _count: { select: { questions: true } },
      },
    });
    if (!mock) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mock);
  } catch (err) {
    logger.error("mock_get_failed", err, { path: "/api/mock-tests/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
