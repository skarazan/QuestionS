import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { checkLimit, getClientIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rate = await checkLimit("register", `register:${ip}`);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } }
      );
    }

    const body = await req.json();
    // registerSchema is .strict() — rejects role, admin, and other unknown fields.
    const { name, email, password } = registerSchema.parse(body);

    const hashed = await bcrypt.hash(password, 12);

    try {
      const user = await prisma.user.create({
        data: { name, email, password: hashed },
        select: { id: true, email: true, name: true },
      });
      return NextResponse.json(user, { status: 201 });
    } catch (err) {
      // P2002 = unique constraint (duplicate email) — generic message to prevent enumeration.
      if (err?.code === "P2002") {
        return NextResponse.json(
          { error: "Registration failed. Try signing in." },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    logger.error("register_failed", err, { path: "/api/register" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
