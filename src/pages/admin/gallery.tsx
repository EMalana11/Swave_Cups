import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteGalleryImage, fetchAllGallery, saveGalleryImage, togglePublish } from "@/api/gallery";
import { ImageInput } from "@/components/admin/image-input";
import { PageHeader } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { todayManila } from "@/lib/utils";
import type { GalleryImage } from "@/lib/types";

/** The fields shared by the "upload" form and each photo's "edit" form. */
function PhotoFields({ photo }: { photo?: GalleryImage }) {
  const k = photo?.id ?? "new";
  return (
    <>
      {photo && <input type="hidden" name="id" value={photo.id} />}
      <div><span className="label">{photo ? "Replace image (optional)" : "Image *"}</span><ImageInput current={photo?.image_url} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" name="title" id={`t-${k}`}><input id={`t-${k}`} name="title" maxLength={150} className="input" defaultValue={photo?.title ?? ""} /></Field>
        <Field label="Photo date" name="photo_date" id={`pd-${k}`}><input id={`pd-${k}`} name="photo_date" type="date" required className="input" defaultValue={photo?.photo_date ?? todayManila()} /></Field>
      </div>
      <Field label="Description" name="description" id={`d-${k}`}><textarea id={`d-${k}`} name="description" rows={2} maxLength={500} className="input" defaultValue={photo?.description ?? ""} /></Field>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Order (lower = first)" name="sort_order" id={`so-${k}`}><input id={`so-${k}`} name="sort_order" type="number" min={0} max={9999} className="input w-28" defaultValue={photo?.sort_order ?? 0} /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={photo?.is_published ?? true} /> Published</label>
        <SubmitButton pendingText="Saving…">{photo ? "Save changes" : "Upload photo"}</SubmitButton>
      </div>
    </>
  );
}

export default function GalleryAdminPage() {
  usePageTitle("Gallery", "Admin");
  const query = useQuery({ queryKey: ["admin", "gallery"], queryFn: fetchAllGallery });

  return (
    <>
      <PageHeader title="Gallery" subtitle="Only published photos appear on the public gallery." />
      <ActionForm action={saveGalleryImage} resetOnSuccess className="card mb-6 space-y-4">
        <h2 className="text-lg font-bold">Upload a photo</h2>
        <PhotoFields />
      </ActionForm>

      <Async query={query} errorMessage="Could not load the gallery.">
        {(images) => images.length === 0 ? <EmptyState title="No photos yet">Upload your first photo above.</EmptyState> : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((g) => (
              <li key={g.id} className="card overflow-hidden p-0">
                <img src={g.image_url} alt={g.title ?? "Gallery photo"} loading="lazy" className="aspect-video w-full object-cover" />
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate">{g.title || "Untitled"}</strong>
                    <span className={`badge ${g.is_published ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"}`}>{g.is_published ? "Published" : "Hidden"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionForm action={togglePublish} silent>
                      <input type="hidden" name="id" value={g.id} /><input type="hidden" name="to" value={String(!g.is_published)} />
                      <SubmitButton className="btn btn-line btn-sm">{g.is_published ? <><EyeOff className="h-3 w-3" aria-hidden /> Unpublish</> : <><Eye className="h-3 w-3" aria-hidden /> Publish</>}</SubmitButton>
                    </ActionForm>
                    <ActionForm action={deleteGalleryImage}>
                      <input type="hidden" name="id" value={g.id} />
                      <ConfirmButton title="Delete this photo?" message="The photo is removed from the gallery and storage permanently."><Trash2 className="h-3 w-3" aria-hidden /> Delete</ConfirmButton>
                    </ActionForm>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-navy">Edit details</summary>
                    <ActionForm action={saveGalleryImage} className="mt-3 space-y-3"><PhotoFields photo={g} /></ActionForm>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Async>
    </>
  );
}
