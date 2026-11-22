import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_CASH_TEXT = "Pay at the counter, on pickup, or on delivery. Online payment isn't available yet.";

/** Cash-only alert. Prominent on the menu, compact in the cart, so nobody finds out at the counter. */
export function CashOnlyNotice({ text, compact = false, className }: { text?: string | null; compact?: boolean; className?: string }) {
  return (
    <div role="note" className={cn("flex items-start gap-3 rounded-2xl border-2 border-orange/50 bg-orange/10 text-ink", compact ? "p-3" : "p-4", className)}>
      <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-orange text-white", compact ? "h-8 w-8" : "h-10 w-10")}><Banknote className={compact ? "h-4 w-4" : "h-5 w-5"} /></span>
      <div className="min-w-0">
        <p className="font-bold text-rust">Cash only — please bring cash</p>
        <p className="text-sm">{text?.trim() || DEFAULT_CASH_TEXT}</p>
      </div>
    </div>
  );
}
