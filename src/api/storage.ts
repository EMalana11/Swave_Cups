import { supabase } from "@/lib/supabase";

export type Bucket = "menu-images" | "gallery";
export type UploadResult = { url: string; path: string } | { error: string } | null;

const MAX_BYTES = 5 * 1024 * 1024;

/** Detects the real image type from the file's first bytes (the browser-provided type can be faked). */
function sniff(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return { mime: "image/gif", ext: "gif" };
  const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return isWebp ? { mime: "image/webp", ext: "webp" } : null;
}

/** Validates by file CONTENT, then uploads under a random name. Returns null when no file was chosen. */
export async function uploadImage(bucket: Bucket, value: FormDataEntryValue | null): Promise<UploadResult> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_BYTES) return { error: "Image must be 5 MB or smaller." };

  const kind = sniff(new Uint8Array(await value.slice(0, 12).arrayBuffer()));
  if (!kind) return { error: "Only JPG, PNG, WEBP or GIF images are allowed." };

  const path = `${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, value, { contentType: kind.mime, upsert: false });
  if (error) {
    console.error("[upload]", error.message);
    return { error: "Image upload failed. Check the storage setup and try again." };
  }
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl, path };
}

export async function removeImage(bucket: Bucket, path: string | null | undefined) {
  if (path) await supabase.storage.from(bucket).remove([path]);
}
