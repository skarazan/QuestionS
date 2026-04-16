import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";
import { ZodError } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// GET /api/admin/.../questions
export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const questions = await prisma.question.findMany({
    where: { topicId: params.topicId },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(questions);
}

// POST /api/admin/.../questions
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { options, ...questionData } = questionSchema.parse(body);

    const question = await prisma.question.create({
      data: {
        ...questionData,
        topicId: params.topicId,
        options: {
          create: options.map((o, idx) => ({
            ...o,
            order: o.order ?? idx,
          })),
        },
      },
      include: { options: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
