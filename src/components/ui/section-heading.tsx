import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  plain: "",
  paper: "border-y border-line/70 bg-paper",
  butter: "border-y border-butter/60 bg-butter/25",
} as const;

/** A full-width band so long pages read as distinct chapters instead of one endless scroll. */
export function Band({ id, tone = "plain", labelledBy, children, className }: { id?: string; tone?: keyof typeof TONES; labelledBy?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("scroll-mt-20 py-14", TONES[tone], className)}>
      <div className="mx-auto max-w-6xl px-4">{children}</div>
    </section>
  );
}

/** Section title with an icon tile, a handwritten eyebrow and a trailing rule. */
export function SectionHeading({ id, icon, eyebrow, title, className }: { id?: string; icon: ReactNode; eyebrow?: string; title: string; className?: string }) {
  return (
    <div className={cn("mb-8 flex items-center gap-4", className)}>
      <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-navy bg-butter text-navy-deep shadow-[3px_3px_0_0_#2f4486]">{icon}</span>
      <div className="min-w-0">
        {eyebrow && <p className="font-hand text-2xl leading-none text-orange">{eyebrow}</p>}
        <h2 id={id} className="text-3xl font-extrabold leading-tight text-navy md:text-4xl">{title}</h2>
      </div>
      <span aria-hidden className="ml-2 hidden h-0.5 flex-1 rounded bg-gradient-to-r from-navy/40 via-line to-transparent sm:block" />
    </div>
  );
}
