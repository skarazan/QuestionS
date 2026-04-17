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

export async function GET(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { questionId } = await params;
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(question);
}

export async function PUT(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { questionId } = await params;
  try {
    const body = await req.json();
    const { options, ...questionData } = questionSchema.parse(body);
    const question = await prisma.$transaction(async (tx) => {
      await tx.option.deleteMany({ where: { questionId } });
      return tx.question.update({
        where: { id: questionId },
        data: {
          ...questionData,
          options: {
            create: options.map((o, idx) => ({ ...o, order: o.order ?? idx })),
          },
        },
        include: { options: { orderBy: { order: "asc" } } },
      });
    });
    return NextResponse.json(question);
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { questionId } = await params;
  try {
    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
