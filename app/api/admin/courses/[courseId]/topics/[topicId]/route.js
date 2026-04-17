import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { topicSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { topicId } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
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

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { topicId } = await params;
  try {
    const body = await req.json();
    const data = topicSchema.parse(body);
    const topic = await prisma.topic.update({ where: { id: topicId }, data });
    return NextResponse.json(topic);
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    logger.error("admin_topic_update_failed", err, { path: "/api/admin/courses/[id]/topics/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { topicId } = await params;
  try {
    await prisma.topic.delete({ where: { id: topicId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("admin_topic_delete_failed", err, { path: "/api/admin/courses/[id]/topics/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
