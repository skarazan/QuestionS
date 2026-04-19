import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeSubscription } from "@/lib/subscription";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

// DELETE /api/admin/subscriptions/[userId] — revoke
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await params;

  const rate = await checkLimit("admin", session.user.id);
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    await revokeSubscription(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("admin_sub_revoke_failed", err, {
      path: "/api/admin/subscriptions/[userId]",
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
