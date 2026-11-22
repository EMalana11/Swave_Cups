import type { GalleryImage } from "./types";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
export const monthName = (mm: string) => MONTH_NAMES[Number(mm) - 1] ?? mm;
export const monthShort = (mm: string) => monthName(mm).slice(0, 3);

export interface Album {
  key: string;            // "2026-09"
  year: string;           // "2026"
  month: string;          // "09"
  label: string;          // "September 2026"
  shortLabel: string;     // "Sep 2026"
  title: string;          // "Beanbag Afternoons & Pop-up Launch"
  cover: GalleryImage;
  images: GalleryImage[]; // chronological: photo_date asc, then sort_order asc
}

const byDate = (a: GalleryImage, b: GalleryImage) => a.photo_date.localeCompare(b.photo_date) || a.sort_order - b.sort_order;

/** Title-case the first letter of each word, e.g. "beanbag afternoons" -> "Beanbag Afternoons". Leaves "+" and "&" alone. */
const titleCase = (s: string) => s.replace(/(^|[\s(])(\p{L})/gu, (_, sp: string, c: string) => sp + c.toUpperCase());

/** Builds a readable album name from the photo titles the admin already typed (no extra database field needed). */
export function albumTitle(images: GalleryImage[]): string {
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const g of images) {
    const t = (g.title ?? "").trim();
    const k = t.toLowerCase();
    if (t && !seen.has(k)) { seen.add(k); titles.push(t); }
    if (titles.length === 2) break;
  }
  return titles.length ? titles.map(titleCase).join(" & ") : "Cafe memories";
}

/** Groups published photos into one album per month, newest month first. */
export function groupAlbums(images: GalleryImage[]): Album[] {
  const map = new Map<string, GalleryImage[]>();
  for (const g of images) {
    if (!/^\d{4}-\d{2}/.test(g.photo_date)) continue;
    const k = g.photo_date.slice(0, 7);
    map.set(k, [...(map.get(k) ?? []), g]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => {
      const [year, month] = key.split("-");
      const sorted = [...list].sort(byDate);
      // The cover is the photo the admin put first (lowest "order"), not just the oldest one.
      const cover = [...list].sort((a, b) => a.sort_order - b.sort_order || byDate(a, b))[0];
      return { key, year, month, label: `${monthName(month)} ${year}`, shortLabel: `${monthShort(month)} ${year}`, title: albumTitle(sorted), cover, images: sorted };
    });
}

export const albumYears = (albums: Album[]) => [...new Set(albums.map((a) => a.year))].sort((a, b) => b.localeCompare(a));
export const albumsForYear = (albums: Album[], year: string) => albums.filter((a) => a.year === year);

export const photoCount = (n: number) => `${n} photo${n === 1 ? "" : "s"}`;
