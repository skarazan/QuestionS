import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";
import { ZodError } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// GET /api/admin/courses — all courses including unpublished
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { topics: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(courses);
}

// POST /api/admin/courses — create course
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = courseSchema.parse(body);

    // Clean empty imageUrl
    if (data.imageUrl === "") delete data.imageUrl;

    const course = await prisma.course.create({ data });
    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
