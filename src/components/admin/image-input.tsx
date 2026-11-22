import { useEffect, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

/** File input with a live preview of the current or newly chosen image. The file itself is read from the surrounding form. */
export function ImageInput({ name = "image", current, removable }: { name?: string; current?: string | null; removable?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Free the temporary preview URL when it is replaced or the form unmounts.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function handleChange(input: HTMLInputElement) {
    const file = input.files?.[0];
    setError(null);
    if (!file) return setPreview(null);
    if (file.size > MAX_BYTES) {
      input.value = "";
      setPreview(null);
      return setError("Image must be 5 MB or smaller.");
    }
    setPreview(URL.createObjectURL(file));
  }

  const shown = preview ?? current ?? null;
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-cream text-xs text-muted">
        {shown ? <img src={shown} alt="Preview" className="h-full w-full object-cover" /> : "No image"}
      </div>
      <div className="space-y-2 text-sm">
        <input aria-label="Choose image" name={name} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-white"
          onChange={(e) => handleChange(e.currentTarget)} />
        <p className="text-xs text-muted">JPG, PNG, WEBP or GIF, up to 5 MB.</p>
        {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
        {removable && current && <label className="flex items-center gap-2"><input type="checkbox" name="remove_image" /> Remove current image</label>}
      </div>
    </div>
  );
}
