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

// GET: fetch mock test with questions (admin view — includes isCorrect)
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mockTestId } = await params;
    const mock = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: {
        topic: { select: { id: true, title: true, courseId: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              select: {
                id: true,
                text: true,
                difficulty: true,
                options: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    });
    if (!mock) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mock);
  } catch (err) {
    logger.error("admin_mock_get_failed", err, { path: "/api/admin/mock-tests/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH: update mock test metadata + re-assign questions
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mockTestId } = await params;
    const existing = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      select: { id: true, topicId: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { title, description, durationMinutes, isPublished, questionIds } =
      mockTestSchema.parse(body);

    // Verify every questionId belongs to this mock's topic
    const topicQuestions = await prisma.question.findMany({
      where: { topicId: existing.topicId, id: { in: questionIds } },
      select: { id: true },
    });
    if (topicQuestions.length !== questionIds.length) {
      return NextResponse.json(
        { error: "One or more questions do not belong to this topic" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.mockTestQuestion.deleteMany({ where: { mockTestId } });
      return tx.mockTest.update({
        where: { id: mockTestId },
        data: {
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
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("admin_mock_update_failed", err, { path: "/api/admin/mock-tests/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE: remove mock test (cascades to attempts + questions junction)
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { mockTestId } = await params;
    await prisma.mockTest.delete({ where: { id: mockTestId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    logger.error("admin_mock_delete_failed", err, { path: "/api/admin/mock-tests/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
