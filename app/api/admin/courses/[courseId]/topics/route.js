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
  const { courseId } = await params;
  const topics = await prisma.topic.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(topics);
}

export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId } = await params;
  try {
    const body = await req.json();
    const data = topicSchema.parse(body);
    const topic = await prisma.topic.create({
      data: { ...data, courseId },
    });
    return NextResponse.json(topic, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists in this course" }, { status: 400 });
    }
    logger.error("admin_topic_create_failed", err, { path: "/api/admin/courses/[id]/topics" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
