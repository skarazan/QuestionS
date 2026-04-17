import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";
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
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      topics: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId } = await params;
  try {
    const body = await req.json();
    const data = courseSchema.parse(body);
    if (data.imageUrl === "") delete data.imageUrl;
    const course = await prisma.course.update({ where: { id: courseId }, data });
    return NextResponse.json(course);
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    if (err.code === "P2002") return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    logger.error("admin_course_update_failed", err, { path: "/api/admin/courses/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { courseId } = await params;
  try {
    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("admin_course_delete_failed", err, { path: "/api/admin/courses/[id]" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
