import prisma from "@/lib/prisma";
import { getPlan } from "@/lib/rentalPlans";

/**
 * Global, site-wide subscription model.
 * One Subscription row per user (unique). Gives access to every published course.
 * Active = expiresAt > now. Admin bypass handled at call site via session.user.role.
 */
export async function hasActiveSubscription(userId) {
  if (!userId) return false;
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return !!sub && sub.expiresAt > new Date();
}

export async function getSubscription(userId) {
  if (!userId) return null;
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return null;
  return sub;
}

/**
 * Grant or extend subscription. If current sub is still valid, stacks on top.
 * If expired or missing, sets expiresAt = now + plan.days.
 * `plan` is a rental-plan id ("15d" | "1mo" | "1yr" | "2yr").
 */
export async function grantSubscription({ userId, plan, grantedBy, source = "admin" }) {
  const planMeta = getPlan(plan);
  if (!planMeta) throw new Error(`Invalid plan: ${plan}`);

  const existing = await prisma.subscription.findUnique({ where: { userId } });
  const now = new Date();
  const base = existing && existing.expiresAt > now ? existing.expiresAt : now;
  const newExpiry = new Date(base.getTime() + planMeta.days * 86400_000);

  return prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan, expiresAt: newExpiry, grantedBy, source },
    update: { plan, expiresAt: newExpiry, grantedBy, source },
  });
}

export async function revokeSubscription(userId) {
  await prisma.subscription.deleteMany({ where: { userId } });
}

export function daysRemaining(expiresAt) {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400_000));
}
