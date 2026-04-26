import { createClient } from "@supabase/supabase-js";

const BUCKET = "question-images";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// Server-only client (service role — bypasses RLS)
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

/**
 * Upload a Buffer/Uint8Array to Supabase Storage.
 * @param {Buffer} buffer
 * @param {string} path  e.g. "questions/abc123.jpg"
 * @param {string} mime  e.g. "image/jpeg"
 * @returns {string} Public URL
 */
export async function uploadImage(buffer, path, mime) {
  const supabase = getClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file by its storage path (not full URL).
 */
export async function deleteImage(path) {
  const supabase = getClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export { MAX_BYTES, ALLOWED_MIME };
