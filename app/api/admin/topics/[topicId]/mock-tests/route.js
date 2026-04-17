import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mockTestSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// GET: list all mock tests for a topic
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topicId } = await params;
    const mocks = await prisma.mockTest.findMany({
      where: { topicId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true, attempts: true } } },
    });
    return NextResponse.json(mocks);
  } catch (err) {
    logger.error("admin_mock_list_failed", err, { path: "/api/admin/topics/[topicId]/mock-tests" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST: create a mock test + assign questions
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topicId } = await params;
    const body = await req.json();
    const { title, description, durationMinutes, isPublished, questionIds } =
      mockTestSchema.parse(body);

    // Verify every questionId belongs to this topic
    const topicQuestions = await prisma.question.findMany({
      where: { topicId, id: { in: questionIds } },
      select: { id: true },
    });
    if (topicQuestions.length !== questionIds.length) {
      return NextResponse.json(
        { error: "One or more questions do not belong to this topic" },
        { status: 400 }
      );
    }

    const mock = await prisma.mockTest.create({
      data: {
        topicId,
        title,
        description,
        durationMinutes,
        isPublished,
        questions: {
          create: questionIds.map((qid, idx) => ({ questionId: qid, order: idx })),
        },
      },
      include: { _count: { select: { questions: true } } },
    });

    return NextResponse.json(mock, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("admin_mock_create_failed", err, { path: "/api/admin/topics/[topicId]/mock-tests" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
