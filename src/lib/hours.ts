import type { HoursRow } from "./types";

export const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHORT: Record<string, string> = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
export const shortDay = (d: string) => SHORT[d] ?? d.slice(0, 3);

/** "15:00" -> "3:00 PM" */
export function fmtTime(t: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  const h = Number(m[1]), min = m[2];
  return `${((h + 11) % 12) + 1}:${min} ${h >= 12 ? "PM" : "AM"}`;
}
const toMin = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };

/** A day counts as "set" when the owner marked it closed, or gave both an opening and a closing time. */
export const isSet = (h: HoursRow | undefined) => !!h && (h.closed || (!Number.isNaN(toMin(h.open)) && !Number.isNaN(toMin(h.close))));

/** The 7 days in Monday-first order; missing days become unset placeholders. */
export function weekRows(hours: HoursRow[]): HoursRow[] {
  return DAY_ORDER.map((day) => hours.find((h) => h?.day === day) ?? { day, open: "", close: "", closed: false });
}
export const hasHours = (hours: HoursRow[]) => weekRows(hours).some(isSet);

/** Current day (0 = Monday … 6 = Sunday) and minutes since midnight in Manila, where the cafe is. */
export function manilaNow(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: DAY_ORDER.indexOf(get("weekday") as (typeof DAY_ORDER)[number]), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenState = "open" | "closed" | "unknown";
export interface OpenStatus { state: OpenState; label: string; detail: string; todayIndex: number }

/**
 * Open/closed right now, from the weekly schedule. Handles late closing past midnight (e.g. 18:00–01:00),
 * where the tail of yesterday's shift still counts as open this morning.
 */
export function getOpenStatus(hours: HoursRow[], now: Date = new Date()): OpenStatus {
  const week = weekRows(hours);
  const { day, minutes } = manilaNow(now);
  if (!week.some(isSet)) return { state: "unknown", label: "Check our socials", detail: "We post daily hours on Instagram & Facebook.", todayIndex: day };

  const live = (h: HoursRow) => isSet(h) && !h.closed;
  // Open today?
  const today = week[day];
  if (live(today)) {
    const o = toMin(today.open), c = toMin(today.close);
    const overnight = c <= o;
    if (minutes >= o && (overnight || minutes < c)) return { state: "open", label: "Open now", detail: `Until ${fmtTime(today.close)}${overnight ? " (late)" : ""}`, todayIndex: day };
  }
  // Still inside yesterday's overnight shift?
  const yest = week[(day + 6) % 7];
  if (live(yest) && toMin(yest.close) <= toMin(yest.open) && minutes < toMin(yest.close)) {
    return { state: "open", label: "Open now", detail: `Until ${fmtTime(yest.close)}`, todayIndex: day };
  }
  // Closed: find the next opening.
  if (live(today) && minutes < toMin(today.open)) return { state: "closed", label: "Closed right now", detail: `Opens today at ${fmtTime(today.open)}`, todayIndex: day };
  for (let i = 1; i <= 7; i++) {
    const h = week[(day + i) % 7];
    if (live(h)) return { state: "closed", label: "Closed right now", detail: `Opens ${i === 1 ? "tomorrow" : shortDay(h.day)} at ${fmtTime(h.open)}`, todayIndex: day };
  }
  return { state: "closed", label: "Closed right now", detail: "Check our socials for updates.", todayIndex: day };
}

export interface HoursGroup { days: string; text: string; closed: boolean }

/** Collapses consecutive days with identical hours: "Tue–Sun · 3:00 PM – 10:00 PM", "Mon · Closed". */
export function summarizeHours(hours: HoursRow[]): HoursGroup[] {
  const week = weekRows(hours).map((h) => ({ day: h.day, set: isSet(h), closed: h.closed, text: !isSet(h) ? "" : h.closed ? "Closed" : `${fmtTime(h.open)} – ${fmtTime(h.close)}` }));
  const out: HoursGroup[] = [];
  let i = 0;
  while (i < week.length) {
    const cur = week[i];
    if (!cur.set) { i++; continue; }
    let j = i;
    while (j + 1 < week.length && week[j + 1].set && week[j + 1].text === cur.text) j++;
    out.push({ days: j === i ? shortDay(cur.day) : j === i + 1 ? `${shortDay(cur.day)} & ${shortDay(week[j].day)}` : `${shortDay(cur.day)}–${shortDay(week[j].day)}`, text: cur.text, closed: cur.closed });
    i = j + 1;
  }
  return out;
}
