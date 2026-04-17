import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { topicId } = await params;
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
              select: { id: true, text: true, order: true },
            },
          },
        },
      },
    });
    if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(topic);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 });
  }
}
