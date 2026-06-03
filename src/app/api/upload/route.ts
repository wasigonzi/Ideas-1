import { NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_IMAGES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/x-tiff",
  "image/bmp",
  "image/x-bmp",
  "image/vnd.adobe.photoshop",
]);
const ALLOWED_AUDIO = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave"
]);
const ALLOWED_VIDEO = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
]);
// Common document / archive types accepted as comment/task attachments.
const ALLOWED_FILES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/json"
]);
const MAX_BYTES = 30 * 1024 * 1024; // 30 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB for video backgrounds

const BUCKET = "uploads";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ip = await getClientIp();
  const userId = (session.user as { id?: string }).id ?? ip;
  const limited = checkRateLimit(`upload:${userId}`, 60, 60 * 1000); // 60 archivos/min por usuario
  if (limited) return limited;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    console.error("[upload] no_file — got:", typeof file, file);
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  const isImage = ALLOWED_IMAGES.has(file.type);
  const isAudio = ALLOWED_AUDIO.has(file.type);
  const isVideo = ALLOWED_VIDEO.has(file.type);
  const isFile = ALLOWED_FILES.has(file.type);
  if (!isImage && !isAudio && !isVideo && !isFile) {
    console.error("[upload] invalid_type:", file.type, "name:", file.name);
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_BYTES)) {
    console.error("[upload] too_large:", file.size, "type:", file.type);
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, buf, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[upload] Supabase Storage error:", error.message);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(name);

  return NextResponse.json({
    url: publicData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    kind: isImage ? "image" : isAudio ? "audio" : "file"
  });
}

