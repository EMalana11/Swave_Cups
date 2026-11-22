import { useQuery } from "@tanstack/react-query";
import { fetchSettings, DEFAULT_SETTINGS } from "@/api/settings";
import { fetchMenu } from "@/api/menu";
import { fetchPublishedGallery } from "@/api/gallery";
import type { CafeSettings } from "@/lib/types";

const FIVE_MINUTES = 5 * 60_000;

/** Cafe settings. Falls back to sensible defaults if they can't be loaded, so public pages never break. */
export function useSettings(): { settings: CafeSettings; ready: boolean } {
  const query = useQuery({ queryKey: ["settings"], queryFn: fetchSettings, staleTime: FIVE_MINUTES });
  return { settings: query.data ?? DEFAULT_SETTINGS, ready: !query.isPending };
}

export const useMenu = () => useQuery({ queryKey: ["menu"], queryFn: fetchMenu, staleTime: 60_000 });

export const usePublishedGallery = (limit?: number) =>
  useQuery({ queryKey: ["gallery", "published", limit ?? "all"], queryFn: () => fetchPublishedGallery(limit), staleTime: 60_000 });
