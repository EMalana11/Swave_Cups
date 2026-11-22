import type { CafeSettings } from "@/lib/types";

export function Footer({ s }: { s: CafeSettings }) {
  return (
    <footer className="mt-20 bg-navy-deep py-10 text-center text-sm text-white/80">
      <p className="font-serif text-lg text-butter">{s.cafe_name}</p>
      <p className="mt-1">Kape saglit, laban ulit. ☕</p>
      <p className="mt-4 text-xs">© {new Date().getFullYear()} {s.cafe_name}</p>
    </footer>
  );
}
