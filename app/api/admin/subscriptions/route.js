import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { grantSubscriptionSchema } from "@/lib/validations";
import { grantSubscription } from "@/lib/subscription";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// GET /api/admin/subscriptions?page=1&search=&status=
//   status: "active" | "expired" | "all" (default "all")
export async function GET(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = 50;
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const status = url.searchParams.get("status") || "all";
  const now = new Date();

  const where = {};
  if (status === "active") where.expiresAt = { gt: now };
  else if (status === "expired") where.expiresAt = { lte: now };
  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  try {
    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { expiresAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      prisma.subscription.count({ where }),
    ]);
    return NextResponse.json({ subscriptions: subs, total, page, pageSize });
  } catch (err) {
    logger.error("admin_sub_list_failed", err, { path: "/api/admin/subscriptions" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/admin/subscriptions  { email, plan }
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkLimit("admin", session.user.id);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, plan } = grantSubscriptionSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Ask them to register first." },
        { status: 404 }
      );
    }

    const sub = await grantSubscription({
      userId: user.id,
      plan,
      grantedBy: session.user.email || session.user.id,
      source: "admin",
    });
    return NextResponse.json({ subscription: sub }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("admin_sub_grant_failed", err, { path: "/api/admin/subscriptions" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
