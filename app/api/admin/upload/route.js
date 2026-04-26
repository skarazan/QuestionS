import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage, MAX_BYTES, ALLOWED_MIME } from "@/lib/storage";
import { checkLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { extname } from "path";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

const EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// POST /api/admin/upload
// multipart/form-data: field "file"
// Returns: { url: string }
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkLimit("admin", session.user.id);
  if (!rate.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG and WebP images are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 2MB limit" },
        { status: 400 }
      );
    }

    const ext = EXT_MAP[file.type] ?? extname(file.name) ?? ".jpg";
    const path = `questions/${randomUUID()}${ext}`;
    const url = await uploadImage(buffer, path, file.type);

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    logger.error("admin_upload_failed", err, { path: "/api/admin/upload" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
