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

// GET /api/admin/courses/[courseId]/topics
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topics = await prisma.topic.findMany({
    where: { courseId: params.courseId },
    orderBy: { order: "asc" },
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(topics);
}

// POST /api/admin/courses/[courseId]/topics
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = topicSchema.parse(body);
    const topic = await prisma.topic.create({
      data: { ...data, courseId: params.courseId },
    });
    return NextResponse.json(topic, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists in this course" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
