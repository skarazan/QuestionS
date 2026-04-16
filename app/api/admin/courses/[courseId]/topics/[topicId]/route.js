import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { topicSchema } from "@/lib/validations";
import { ZodError } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// GET /api/admin/courses/[courseId]/topics/[topicId]
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topic = await prisma.topic.findUnique({
    where: { id: params.topicId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
          _count: { select: { attemptAnswers: true } },
        },
      },
    },
  });
  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(topic);
}

// PUT /api/admin/courses/[courseId]/topics/[topicId]
export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = topicSchema.parse(body);
    const topic = await prisma.topic.update({
      where: { id: params.topicId },
      data,
    });
    return NextResponse.json(topic);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[courseId]/topics/[topicId]
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.topic.delete({ where: { id: params.topicId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
