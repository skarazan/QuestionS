import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";
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
  const questions = await prisma.question.findMany({
    where: { topicId },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(questions);
}

export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { topicId } = await params;
  try {
    const body = await req.json();
    const { options, ...questionData } = questionSchema.parse(body);
    const question = await prisma.question.create({
      data: {
        ...questionData,
        topicId,
        options: {
          create: options.map((o, idx) => ({ ...o, order: o.order ?? idx })),
        },
      },
      include: { options: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    logger.error("admin_question_create_failed", err, { path: "/api/admin/.../questions" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
