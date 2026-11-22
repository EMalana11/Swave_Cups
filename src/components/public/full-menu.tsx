import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Coffee, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./cart";
import { CashOnlyNotice } from "./cash-notice";
import { ThemeToggle } from "./theme-toggle";
import { peso, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export type MenuGroup = { id: string; name: string; products: Product[] };

const secId = (id: string) => `cat-${id}`;

/** Product photo; a themed placeholder shows if there's no image or it fails to load. */
function Photo({ src, alt }: { src: string | null; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div role="img" aria-label={`${alt} — photo coming soon`} className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-butter/70 via-yellow-100 to-orange-100 text-rust">
        <Coffee className="h-8 w-8" aria-hidden />
        <span aria-hidden className="font-hand text-lg leading-none opacity-80">photo coming soon</span>
      </div>
    );
  }
    return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className="aspect-square w-full object-cover" />;
}

export function FullMenu({ groups, ordersEnabled, notice }: { groups: MenuGroup[]; ordersEnabled: boolean; notice: string | null }) {
  const { add, count } = useCart();
  const [active, setActive] = useState(groups[0]?.id ?? "");
  const pillBar = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lockUntil = useRef(0); // ignore scroll-spy while a tap-triggered smooth scroll is running

  // Scroll-spy: highlight the pill of the section currently under the sticky header.
  useEffect(() => {
    if (groups.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.getAttribute("data-cat") ?? "");
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    for (const g of groups) { const el = document.getElementById(secId(g.id)); if (el) obs.observe(el); }
    return () => obs.disconnect();
  }, [groups]);

  // Keep the active pill centred in the sideways-scrolling bar.
  useEffect(() => {
    const bar = pillBar.current, btn = pillRefs.current[active];
    if (!bar || !btn) return;
    bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const jump = useCallback((id: string) => {
    setActive(id);
    lockUntil.current = Date.now() + 800;
    document.getElementById(secId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasItems = count > 0;
  const orderBtn = "pointer-events-auto mx-auto flex h-14 w-full max-w-md items-center justify-center gap-3 rounded-full border-2 border-navy bg-navy text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_5px_0_0_#1f2d5c] transition active:translate-y-[3px] active:shadow-[0_2px_0_0_#1f2d5c] sm:h-16 sm:text-base";

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Sticky header + category pills */}
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" aria-label="Back to home" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-navy bg-butter text-navy-deep shadow-[2px_2px_0_0_#2f4486] transition active:translate-x-px active:translate-y-px active:shadow-none">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1 leading-none">
            <p className="font-hand text-lg text-orange">pick your fave</p>
            <h1 className="font-serif text-2xl font-extrabold text-navy">Our menu</h1>
          </div>
          <ThemeToggle />
        </div>
        {groups.length > 0 && (
          <nav aria-label="Menu categories" className="border-t border-line/70">
            <div ref={pillBar} className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {groups.map((g) => (
                <button key={g.id} type="button" ref={(el) => { pillRefs.current[g.id] = el; }} onClick={() => jump(g.id)} aria-current={active === g.id ? "true" : undefined}
                  className={cn("shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition",
                    active === g.id ? "border-navy bg-butter text-navy-deep shadow-[2px_2px_0_0_#2f4486]" : "border-line bg-white text-ink hover:border-navy")}>
                  {g.name}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-40 pt-5">
        <CashOnlyNotice text={notice} compact className="mx-auto max-w-xl" />
        {!ordersEnabled && <div role="status" className="mx-auto mt-3 max-w-xl rounded-xl bg-amber-100 p-3 text-center text-sm text-amber-900">Online ordering is paused right now. You can still browse the menu.</div>}

        {groups.length === 0 ? (
          <p className="py-24 text-center text-muted">Our menu is brewing. Please check back soon.</p>
        ) : groups.map((g) => (
          <section key={g.id} id={secId(g.id)} data-cat={g.id} aria-labelledby={`h-${g.id}`} className="scroll-mt-36 pt-9">
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="h-0.5 flex-1 rounded bg-gradient-to-r from-transparent to-navy/30" />
              <h2 id={`h-${g.id}`} className="text-center font-serif text-2xl font-extrabold text-navy">{g.name}</h2>
              <span aria-hidden className="h-0.5 flex-1 rounded bg-gradient-to-l from-transparent to-navy/30" />
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {g.products.map((p) => (
                <li key={p.id} className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <Link to={`/menu/${p.slug}`} aria-label={`View ${p.name}, ${peso(p.price)}`} className="block">
                    <div className="relative">
                      <Photo src={p.image_url} alt={p.name} />
                      {p.is_featured && <span className="badge absolute left-2 top-2 bg-butter text-navy-deep">Favorite</span>}
                    </div>
                    <div className="px-2.5 pb-3.5 pt-3 text-center">
                      <h3 className="line-clamp-2 min-h-[2.5rem] font-serif text-sm font-bold leading-tight sm:text-base">{p.name}</h3>
                      <p className="mt-1.5 text-base font-extrabold text-orange">{peso(p.price)}</p>
                    </div>
                  </Link>
                  {ordersEnabled && (
                    <button type="button" aria-label={`Add ${p.name} to cart`}
                      onClick={() => { add({ id: p.id, name: p.name, price: p.price, image: p.image_url }); toast.success(`${p.name} added to cart`); }}
                      className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-orange text-white shadow-md transition hover:bg-orange-dark active:scale-90 sm:h-10 sm:w-10">
                      <Plus className="h-5 w-5" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {/* Floating ORDER NOW */}
      <div className="menu-fade pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12">
        {!ordersEnabled ? (
          <div className={cn(orderBtn, "border-line bg-line text-muted shadow-none")} aria-disabled="true">Ordering paused</div>
        ) : hasItems ? (
          <Link to="/cart" className={orderBtn}>
            Order now <ArrowRight className="h-5 w-5 text-butter" aria-hidden />
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-butter px-1.5 text-xs font-bold tracking-normal text-navy-deep" aria-label={`${count} items in cart`}>{count}</span>
          </Link>
        ) : (
          <button type="button" onClick={() => toast("Tap the + on any item to start your order")} className={orderBtn}>
            Order now <ArrowRight className="h-5 w-5 text-butter" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
