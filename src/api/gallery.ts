import { fieldErrors, gallerySchema, idSchema } from "@/lib/validation";
import { supabase, unwrap } from "@/lib/supabase";
import { dbMessage, done, fail } from "@/lib/utils";
import { removeImage, uploadImage } from "./storage";
import type { ActionState, GalleryImage } from "@/lib/types";

export async function fetchPublishedGallery(limit?: number): Promise<GalleryImage[]> {
  let query = supabase.from("gallery_images").select("*").eq("is_published", true).order("photo_date", { ascending: false }).order("sort_order");
  if (limit) query = query.limit(limit);
  return unwrap(await query);
}

export async function fetchAllGallery(): Promise<GalleryImage[]> {
  return unwrap(await supabase.from("gallery_images").select("*").order("photo_date", { ascending: false }).order("sort_order"));
}

export async function saveGalleryImage(fd: FormData): Promise<ActionState> {
  const parsed = gallerySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const id = String(fd.get("id") ?? "");

  const upload = await uploadImage("gallery", fd.get("image"));
  if (upload && "error" in upload) return fail(upload.error, { image: upload.error });
  const uploaded = upload && "path" in upload ? upload : null;
  if (!id && !uploaded) return fail("Choose an image to upload.", { image: "Choose an image to upload." });

  const row: Record<string, unknown> = { ...parsed.data };
  if (uploaded) { row.image_url = uploaded.url; row.storage_path = uploaded.path; }

  let previousPath: string | null = null;
  if (id) {
    idSchema.parse(id);
    const prev = unwrap(await supabase.from("gallery_images").select("storage_path").eq("id", id).maybeSingle()) as { storage_path: string | null } | null;
    previousPath = uploaded ? prev?.storage_path ?? null : null;
  }

  const { error } = id ? await supabase.from("gallery_images").update(row).eq("id", id) : await supabase.from("gallery_images").insert(row);
  if (error) {
    await removeImage("gallery", uploaded?.path);
    return fail(dbMessage(error));
  }
  await removeImage("gallery", previousPath);
  return done(id ? "Photo updated." : "Photo uploaded.");
}

export async function togglePublish(fd: FormData): Promise<ActionState> {
  const { error } = await supabase.from("gallery_images").update({ is_published: fd.get("to") === "true" }).eq("id", idSchema.parse(fd.get("id")));
  return error ? fail(dbMessage(error)) : done("Photo visibility updated.");
}

export async function deleteGalleryImage(fd: FormData): Promise<ActionState> {
  const id = idSchema.parse(fd.get("id"));
  const prev = unwrap(await supabase.from("gallery_images").select("storage_path").eq("id", id).maybeSingle()) as { storage_path: string | null } | null;
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) return fail(dbMessage(error));
  await removeImage("gallery", prev?.storage_path);
  return done("Photo deleted.");
}
