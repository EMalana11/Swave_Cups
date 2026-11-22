import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { albumYears, albumsForYear, groupAlbums, monthName, monthShort, photoCount, type Album } from "@/lib/gallery";
import { cn, fmtDate } from "@/lib/utils";
import type { GalleryImage } from "@/lib/types";

type Open = { key: string; index: number } | null;

/** Year bar → month pills → album cards → full-screen lightbox. */
export function GalleryArchive({ images }: { images: GalleryImage[] }) {
  const albums = useMemo(() => groupAlbums(images), [images]);
  const years = useMemo(() => albumYears(albums), [albums]);
  const [year, setYear] = useState(years[0] ?? "");
  const [month, setMonth] = useState("all");
  const [open, setOpen] = useState<Open>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Old links like /gallery#photo-<id> (from the home page) open straight into that album.
  useEffect(() => {
    const m = /^#photo-(.+)$/.exec(window.location.hash);
    if (!m) return;
    for (const a of albums) {
      const index = a.images.findIndex((g) => g.id === m[1]);
      if (index >= 0) { setYear(a.year); setOpen({ key: a.key, index }); return; }
    }
  }, [albums]);

  const yearAlbums = useMemo(() => albumsForYear(albums, year), [albums, year]);
  const shown = month === "all" ? yearAlbums : yearAlbums.filter((a) => a.month === month);
  const shownPhotos = shown.reduce((n, a) => n + a.images.length, 0);
  const current = open ? albums.find((a) => a.key === open.key) ?? null : null;

  const openAlbum = (a: Album, index = 0) => { opener.current = document.activeElement as HTMLElement | null; setOpen({ key: a.key, index }); };
  const close = useCallback(() => {
    setOpen(null);
    if (window.location.hash.startsWith("#photo-")) history.replaceState(null, "", window.location.pathname);
    requestAnimationFrame(() => opener.current?.focus());
  }, []);
  const pickYear = (y: string) => { setYear(y); setMonth("all"); };

  if (albums.length === 0) return <EmptyState title="Our gallery is brewing.">Photos from the cafe will appear here.</EmptyState>;

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose a year">
          <CalendarDays className="mr-1 h-5 w-5 text-orange" aria-hidden />
          {years.map((y) => (
            <button key={y} role="tab" aria-selected={y === year} onClick={() => pickYear(y)}
              className={cn("rounded-full border-2 px-5 py-1.5 text-base font-bold transition", y === year ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-navy")}>{y}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={`Months in ${year}`}>
          <Pill active={month === "all"} onClick={() => setMonth("all")}>All months</Pill>
          {yearAlbums.map((a) => <Pill key={a.key} active={month === a.month} onClick={() => setMonth(a.month)}>{monthName(a.month)} <span className="opacity-70">· {a.images.length}</span></Pill>)}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted" aria-live="polite">
        {shown.length} album{shown.length === 1 ? "" : "s"} · {photoCount(shownPhotos)} in {month === "all" ? year : `${monthName(month)} ${year}`}
      </p>

      <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((a) => (
          <li key={a.key} className="relative isolate">
            {a.images.length > 1 && <>
              <span aria-hidden className="absolute inset-0 -z-10 rotate-2 rounded-2xl border border-line bg-white" />
              <span aria-hidden className="absolute inset-0 -z-10 -rotate-1 rounded-2xl border border-line bg-paper" />
            </>}
            <button type="button" onClick={() => openAlbum(a)} aria-label={`Open album ${a.title}, ${a.label}, ${photoCount(a.images.length)}`}
              className="group block w-full overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="relative block aspect-[4/3] overflow-hidden bg-butter/30">
                <img src={a.cover.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-navy-deep/90 px-3 py-1 text-xs font-bold text-white"><Images className="h-3.5 w-3.5" aria-hidden />{photoCount(a.images.length)}</span>
                <span className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-2.5 py-1 font-serif text-sm font-bold text-navy shadow">{monthShort(a.month)} {a.year}</span>
              </span>
              <span className="block p-4">
                <span className="block font-hand text-xl leading-none text-orange">{a.shortLabel}</span>
                <span className="mt-1 block text-lg font-bold leading-snug text-ink">{a.title}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy">Open album <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden /></span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && open && (
        <Lightbox album={current} index={open.index} onIndex={(i) => setOpen({ key: current.key, index: i })} onClose={close}
          onCrumb={(target) => { setYear(current.year); setMonth(target === "month" ? current.month : "all"); close(); }} />
      )}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition", active ? "border-orange bg-orange text-white" : "border-line bg-white hover:border-navy")}>{children}</button>
  );
}

function Lightbox({ album, index, onIndex, onClose, onCrumb }: { album: Album; index: number; onIndex: (i: number) => void; onClose: () => void; onCrumb: (t: "year" | "month") => void }) {
  const n = album.images.length;
  const img = album.images[index];
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((to: number) => onIndex(Math.min(n - 1, Math.max(0, to))), [n, onIndex]);

  useEffect(() => {
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      else if (e.key === "Home") { e.preventDefault(); go(0); }
      else if (e.key === "End") { e.preventDefault(); go(n - 1); }
      else if (e.key === "Tab" && dialog.current) {
        // Keep focus inside the dialog while it is open.
        const f = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, n, onClose]);

  // Keep the active thumbnail in view and warm the neighbouring photos.
  useEffect(() => {
    thumbs.current[index]?.scrollIntoView({ inline: "center", block: "nearest" });
    for (const j of [index - 1, index + 1]) { const g = album.images[j]; if (g) { const im = new Image(); im.src = g.image_url; } }
  }, [index, album.images]);

  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current; touch.current = null;
    const t = e.changedTouches[0];
    if (!s || !t) return;
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={`${album.title}, photo ${index + 1} of ${n}`} className="fixed inset-0 z-[60] flex flex-col bg-navy-deep/95 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-white/80">
            <li><button type="button" onClick={onClose} className="rounded px-1 hover:text-white hover:underline">Gallery</button></li>
            <li aria-hidden><ChevronRight className="h-4 w-4" /></li>
            <li><button type="button" onClick={() => onCrumb("year")} className="rounded px-1 hover:text-white hover:underline">{album.year}</button></li>
            <li aria-hidden><ChevronRight className="h-4 w-4" /></li>
            <li><button type="button" onClick={() => onCrumb("month")} aria-current="page" className="rounded px-1 font-bold text-white hover:underline">{monthName(album.month)}</button></li>
          </ol>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-white/80" aria-live="polite">{index + 1} / {n}</span>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close gallery" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" aria-hidden /></button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20"
        onTouchStart={(e) => { const t = e.touches[0]; touch.current = t ? { x: t.clientX, y: t.clientY } : null; }} onTouchEnd={onTouchEnd}>
        <NavBtn side="left" label="Previous photo" disabled={index === 0} onClick={() => go(index - 1)} />
        <img key={img.id} src={img.image_url} alt={img.title ?? img.description ?? `${album.label} photo ${index + 1}`} className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl" draggable={false} />
        <NavBtn side="right" label="Next photo" disabled={index === n - 1} onClick={() => go(index + 1)} />
      </div>

      <div className="px-4 pb-2 pt-3 text-center">
        <p className="font-serif text-lg font-bold">{img.title || album.title}</p>
        {img.description && <p className="text-sm text-white/80">{img.description}</p>}
        <p className="text-xs text-white/60">{fmtDate(img.photo_date)}</p>
      </div>

      {n > 1 && (
        <ul className="flex gap-2 overflow-x-auto px-4 pb-4 sm:justify-center" aria-label="Photos in this album">
          {album.images.map((g, i) => (
            <li key={g.id} className="shrink-0">
              <button ref={(el) => { thumbs.current[i] = el; }} type="button" onClick={() => go(i)} aria-label={`Go to photo ${i + 1}`} aria-current={i === index ? "true" : undefined}
                className={cn("block overflow-hidden rounded-lg border-2 transition", i === index ? "border-butter opacity-100" : "border-transparent opacity-60 hover:opacity-100")}>
                <img src={g.image_url} alt="" loading="lazy" className="h-14 w-14 object-cover sm:h-16 sm:w-16" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavBtn({ side, label, disabled, onClick }: { side: "left" | "right"; label: string; disabled: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      className={cn("absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-25", side === "left" ? "left-2 sm:left-5" : "right-2 sm:right-5")}>
      <Icon className="h-6 w-6" aria-hidden />
    </button>
  );
}
