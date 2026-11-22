/** Embeddable Google Maps URL for a free-text place (no API key needed). */
export const mapEmbedUrl = (query: string) => `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

/** Opens turn-by-turn directions in the Google Maps app or site. */
export const directionsUrl = (query: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

/**
 * The pop-up location is a short name like "Canaman Boulevard". Borrow the town and province from the cafe's
 * address ("…, San Vicente, Canaman, Camarines Sur") so the map search lands in the right place.
 */
export function popupQuery(popup: string, address: string | null): string {
  const parts = (address ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const area = parts.slice(-2).join(", ");
  if (!area || popup.toLowerCase().includes(parts[parts.length - 1]?.toLowerCase() ?? "\u0000")) return popup;
  return `${popup}, ${area}`;
}

/** Only allow real https links in "Directions" buttons. */
export const safeHttps = (u: string | null | undefined) => { try { return u && new URL(u).protocol === "https:" ? u : null; } catch { return null; } };
