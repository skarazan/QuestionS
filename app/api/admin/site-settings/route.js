import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { siteSettingsSchema } from "@/lib/validations";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// GET /api/admin/site-settings — returns the singleton row (creates if missing)
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
    return NextResponse.json(settings);
  } catch (err) {
    logger.error("site_settings_get_failed", err, { path: "/api/admin/site-settings" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PUT /api/admin/site-settings — update global prices
export async function PUT(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkLimit("admin", session.user.id);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const data = siteSettingsSchema.parse(body);
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...data },
      update: data,
    });
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("site_settings_update_failed", err, { path: "/api/admin/site-settings" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
