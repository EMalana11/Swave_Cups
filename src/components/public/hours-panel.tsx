import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/brand-icons";
import { fmtTime, getOpenStatus, hasHours, isSet, shortDay, summarizeHours, weekRows, type OpenStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";
import type { HoursRow } from "@/lib/types";

/** Live open/closed status for the weekly schedule, refreshed every minute. */
function useOpenStatus(hours: HoursRow[]): OpenStatus {
  const [status, setStatus] = useState(() => getOpenStatus(hours));
  useEffect(() => {
    const tick = () => setStatus(getOpenStatus(hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  return status;
}

const LOOK = {
  open: { pill: "bg-green-100 text-green-900", dot: "bg-green-500" },
  closed: { pill: "bg-stone-200 text-stone-800", dot: "bg-red-500" },
  unknown: { pill: "bg-butter/70 text-navy-deep", dot: "bg-orange" },
} as const;

/** Small live pill: "Open now · until 10:00 PM". */
export function OpenChip({ hours, className }: { hours: HoursRow[]; className?: string }) {
  const st = useOpenStatus(hours);
  const look = LOOK[st.state];
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md", look.pill, className)}>
      <span aria-hidden className="relative flex h-2.5 w-2.5">
        {st.state === "open" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/60" />}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", look.dot)} />
      </span>
      {st.label}<span className="font-normal opacity-80"> · {st.state === "unknown" ? "lights on = open" : st.detail}</span>
    </span>
  );
}

/** The "Come by" hours card: live status, baseline weekly hours, today highlighted, and a pointer to today's story. */
export function HoursPanel({ hours, instagramUrl, facebookUrl }: { hours: HoursRow[]; instagramUrl: string | null; facebookUrl: string | null }) {
  const st = useOpenStatus(hours);
  const known = hasHours(hours);
  const look = LOOK[st.state];
  const groups = summarizeHours(hours);
  return (
    <div className="card">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Clock className="h-5 w-5 text-orange" aria-hidden /> Hours</h3>

      <div role="status" className={cn("mb-4 flex items-start gap-3 rounded-xl p-3", look.pill)}>
        <span aria-hidden className="relative mt-1.5 flex h-3 w-3 shrink-0">
          {st.state === "open" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/60" />}
          <span className={cn("relative inline-flex h-3 w-3 rounded-full", look.dot)} />
        </span>
        <div>
          <p className="font-bold">{st.label}</p>
          <p className="text-sm">{st.detail}</p>
        </div>
      </div>

      {known ? (
        <>
          <ul className="mb-3 flex flex-wrap gap-2" aria-label="Usual hours">
            {groups.map((g) => (
              <li key={g.days} className={cn("rounded-full border px-3 py-1 text-sm font-semibold", g.closed ? "border-line bg-white text-muted" : "border-navy bg-navy text-white")}>{g.days} · {g.text}</li>
            ))}
          </ul>
          <dl className="divide-y divide-line/70">
            {weekRows(hours).map((h, i) => (
              <div key={h.day} className={cn("flex justify-between rounded px-2 py-1.5 text-sm", st.todayIndex === i && "bg-butter/50 font-semibold")} aria-current={st.todayIndex === i ? "date" : undefined}>
                <dt>{shortDay(h.day)}{st.todayIndex === i && <span className="ml-2 text-xs font-normal text-muted">today</span>}</dt>
                <dd>{!isSet(h) ? "—" : h.closed ? "Closed" : `${fmtTime(h.open)} – ${fmtTime(h.close)}`}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mb-2 text-sm text-muted">We post our hours on our socials.</p>
      )}

      <p className="mt-4 font-hand text-2xl text-rust">If the lights are on, we&apos;re open. ✨</p>
      <p className="mt-1 text-sm text-muted">Hours can shift — we post today&apos;s update on our stories.</p>
      {(instagramUrl || facebookUrl) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {instagramUrl && <a className="btn btn-line btn-sm" href={instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramIcon className="h-4 w-4" /> Today&apos;s story</a>}
          {facebookUrl && <a className="btn btn-line btn-sm" href={facebookUrl} target="_blank" rel="noopener noreferrer"><FacebookIcon className="h-4 w-4" /> Facebook updates</a>}
        </div>
      )}
    </div>
  );
}
