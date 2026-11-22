export const PAGE_SIZE = 15;

/** Reads `?page=` defensively: anything that isn't a positive integer means page 1. */
export const parsePage = (v: string | null | undefined) => Math.max(1, parseInt(v ?? "1", 10) || 1);

/** Zero-based inclusive row range for a Supabase `.range()` call. */
export const pageRange = (page: number, size = PAGE_SIZE) => ({ from: (page - 1) * size, to: page * size - 1 });

/** Strips characters that would break a PostgREST `or(...)` filter. */
export const safeSearch = (v: string | null | undefined) => (v ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);
