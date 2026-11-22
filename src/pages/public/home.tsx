import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Banknote, Coffee, Home as HomeIcon, Images, MapPin, Armchair, Phone, Mail, Sparkles, UtensilsCrossed } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/brand-icons";
import { useMenu, usePublishedGallery, useSettings } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/use-page-title";
import { PageSkeleton } from "@/components/ui/skeletons";
import { DrinkQuiz } from "@/components/public/drink-quiz";
import { AddToCartButton, ProductImage } from "@/components/public/product-ui";
import { kindOf } from "@/lib/menu-kind";
import { CashOnlyNotice } from "@/components/public/cash-notice";
import { HoursPanel, OpenChip } from "@/components/public/hours-panel";
import { LocationMap, type MapPlace } from "@/components/public/location-map";
import { EmptyState } from "@/components/ui/misc";
import { Band, SectionHeading } from "@/components/ui/section-heading";
import { directionsUrl, popupQuery, safeHttps } from "@/lib/maps";
import { peso, fmtDate } from "@/lib/utils";

/** Scrolls to #anchors (e.g. /#visit) once the page content has rendered. */
function useScrollToHash(ready: boolean) {
  const { hash } = useLocation();
  useEffect(() => {
    if (ready && hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [ready, hash]);
}

export default function Home() {
  usePageTitle(null);
  const { settings: s, ready } = useSettings();
  const menuQuery = useMenu();
  const galleryQuery = usePublishedGallery(6);
  useScrollToHash(ready);

  if (!ready) return <PageSkeleton />;

  const products = menuQuery.data?.products ?? [];
  const photos = galleryQuery.data ?? [];
  const fav = products.find((p) => p.is_featured) ?? products[0];

  const places: MapPlace[] = [];
  if (s.address) places.push({ id: "house", name: "Location", query: s.address, directionsHref: safeHttps(s.map_url) ?? directionsUrl(s.address) });
  if (s.popup_location) { const q = popupQuery(s.popup_location, s.address); places.push({ id: "popup", name: "Pop-up Location", query: q, directionsHref: directionsUrl(q) }); }

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="overflow-x-clip bg-gradient-to-b from-butter/25 to-transparent">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div>
            <p className="font-hand text-2xl text-orange">psst, down the street lang kami</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-navy md:text-5xl">More than just coffee. <em className="text-orange">Mostly</em> coffee though.</h1>
            <p className="mt-5 max-w-lg text-lg text-muted">{s.description ?? "Swave Cups is a tiny neighborhood cafe in Progress Homes, San Vicente, Canaman."}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/menu" className="btn btn-solid">See what we&apos;re brewing</Link>
              <Link to="#visit" className="btn btn-line">How to find us</Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2 text-sm font-medium text-navy" aria-label="Good to know">
              <li className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5"><Coffee className="h-4 w-4 text-orange" aria-hidden /> Matcha &amp; coffee</li>
              <li className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5"><Armchair className="h-4 w-4 text-orange" aria-hidden /> Beanbag lounge</li>
              <li className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5"><Banknote className="h-4 w-4 text-orange" aria-hidden /> Cash only</li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:max-w-md">
            <div aria-hidden className="absolute -inset-3 -z-10 rotate-2 rounded-[2.25rem] bg-butter/70" />
            <figure className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-xl">
              <div className="relative aspect-[4/5]">
                <img src="/images/lattes.jpg" alt="Two lattes with leaf art and a wrap on a black table" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <figcaption className="sr-only">Two lattes and a wrap. A good Tuesday.</figcaption>
            </figure>
            <div className="absolute left-4 top-4"><OpenChip hours={s.hours} /></div>
            {fav && (
              <Link to="/menu" className="absolute -bottom-5 right-3 flex items-center gap-2 rounded-2xl border-2 border-navy bg-white px-4 py-2 shadow-[3px_3px_0_0_#2f4486] transition hover:-translate-y-0.5">
                <Sparkles className="h-4 w-4 text-orange" aria-hidden />
                <span className="text-left leading-tight"><span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">Fan favorite</span><span className="block text-sm font-bold text-navy">{fav.name} · {peso(fav.price)}</span></span>
              </Link>
            )}
            <figure className="absolute -bottom-8 -left-5 hidden w-32 -rotate-6 bg-white p-1.5 pb-5 shadow-lg sm:block lg:-left-10 lg:w-36">
              <img src="/images/storefront.jpg" alt="Swave Cafe storefront at night with fairy lights" width={288} height={192} className="aspect-[4/3] object-cover" />
              <figcaption className="mt-0.5 text-center font-hand text-sm leading-tight">lights on = open</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── Menu ───────────── */}
      <Band id="menu" tone="paper" labelledBy="h-menu">
        <SectionHeading id="h-menu" icon={<UtensilsCrossed className="h-6 w-6" />} eyebrow="choose your next favorite" title="The menu" />
        <CashOnlyNotice text={s.order_notice} className="mb-6" />
        {!s.orders_enabled && <div className="mb-6 rounded-xl bg-amber-100 p-4 text-sm text-amber-900" role="status">Online ordering is paused right now. You can still browse the menu.</div>}
        {menuQuery.isError
          ? <div role="alert" className="rounded-xl bg-red-50 p-6 text-red-800">We couldn&apos;t load the menu right now. <button type="button" onClick={() => menuQuery.refetch()} className="font-semibold underline">Try again</button>.</div>
          : menuQuery.isPending
          ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading menu">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-64" />)}</div>
          : (
            <>
              {products.length === 0 ? (
                <EmptyState title="Our menu is brewing.">No products are available yet. Please check back soon.</EmptyState>
              ) : (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {products.slice(0, 6).map((p) => (
                    <li key={p.id} className="card flex flex-col overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-md">
                      <Link to={`/menu/${p.slug}`} className="block" aria-label={`View ${p.name}`}>
                        <div className="relative">
                          <ProductImage src={p.image_url} alt={p.name} kind={kindOf(p)} className="aspect-[16/10] w-full sm:aspect-[4/3]" />
                          {p.categories?.name && <span className="badge absolute left-3 top-3 bg-white/90 text-navy">{p.categories.name}</span>}
                          {p.is_featured && <span className="badge absolute right-3 top-3 bg-butter text-navy-deep">Favorite</span>}
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                        <h3 className="text-lg font-bold"><Link to={`/menu/${p.slug}`} className="hover:text-orange">{p.name}</Link></h3>
                        <p className="mt-1 flex-1 text-sm text-muted">{p.short_description || p.description || "Made with love at Swave Cups."}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <strong className="text-lg text-navy">{peso(p.price)}</strong>
                          <AddToCartButton product={p} ordersEnabled={s.orders_enabled} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 text-center"><Link to="/menu" className="btn btn-solid">View full menu →</Link></div>
              <DrinkQuiz products={products} ordersEnabled={s.orders_enabled} />
            </>
          )}
      </Band>

      {/* ───────────── Gallery preview ───────────── */}
      <Band labelledBy="gp">
        <SectionHeading id="gp" icon={<Images className="h-6 w-6" />} eyebrow="photos, events, and cafe memories" title="Little moments at Swave" />
        {photos.length === 0 ? <EmptyState title="Our gallery is waiting for its first memories.">Check back soon!</EmptyState> : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {photos.map((g) => (
              <li key={g.id}><Link to={`/gallery#photo-${g.id}`} className="group relative block overflow-hidden rounded-2xl">
                <img src={g.image_url} alt={g.title ?? "Swave Cups gallery photo"} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3 text-sm text-white"><small className="block opacity-80">{fmtDate(g.photo_date)}</small>{g.title}</span>
              </Link></li>
            ))}
          </ul>
        )}
        <div className="mt-6 text-center"><Link to="/gallery" className="btn btn-line">Browse albums by year &amp; month ↗</Link></div>
      </Band>

      {/* ───────────── Story ───────────── */}
      <Band id="story" tone="butter" labelledBy="h-story">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img src="/images/barista.jpg" alt="Our barista working behind the counter" width={600} height={600} className="rotate-[-2deg] rounded-xl border-8 border-white shadow-lg" />
          <div>
            <SectionHeading id="h-story" icon={<HomeIcon className="h-6 w-6" />} eyebrow="a little about us" title="Hi, we're Swave." className="mb-6" />
            <div className="space-y-4 text-lg">
              <p>We started this cafe out of our own house in Progress Homes because honestly, we wanted a place nearby where you could get a proper cup without driving to the city.</p>
              <p>Everything&apos;s made at the window counter — one grinder, a row of syrup pumps, and a lot of matcha. Nothing fancy. We just care about getting it right, and we like knowing our regulars by their order.</p>
              {s.popup_location && <p>You&apos;ll also find us at our <strong>pop-up on {s.popup_location}</strong>, so if you see the round logo, come say hi.</p>}
              <p className="font-hand text-3xl text-orange">Kape saglit, laban ulit. ☕</p>
            </div>
          </div>
        </div>
      </Band>

      {/* ───────────── Space ───────────── */}
      <Band id="space" tone="paper" labelledBy="h-space">
        <SectionHeading id="h-space" icon={<Armchair className="h-6 w-6" />} eyebrow="the beanbags are very hard to leave" title="Stay a while" />
        <div className="grid items-center gap-8 md:grid-cols-2">
          <img src="/images/beanbags.jpg" alt="Two friends laughing on beanbags holding a white cat" width={600} height={700} className="rounded-2xl object-cover shadow" />
          <div className="space-y-4">
            {[["Beanbags & bauhaus", "Our little lounge in the front room has big comfy seats, a rug, and posters we picked out ourselves. Good for reading, catching up, or doing nothing at all."],
              ["Outdoor bench", "Grab your iced drink and sit out front under the fairy lights. Best at night when the street's quiet."],
              ["About the cat", "Yes, there's a cat. No, he doesn't work here. He'll probably still sit with you."]].map(([t, d]) => (
              <div key={t} className="card"><h3 className="text-lg font-bold">{t}</h3><p className="mt-1 text-muted">{d}</p></div>))}
          </div>
        </div>
      </Band>

      {/* ───────────── Visit ───────────── */}
      <Band id="visit" labelledBy="h-visit">
        <SectionHeading id="h-visit" icon={<MapPin className="h-6 w-6" />} eyebrow="if the lights are on, we're open" title="Come by" />
        {photos.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">A little look around</p>
                <h3 className="font-serif text-xl font-bold">Photos &amp; moments</h3>
              </div>
              <Link to="/gallery" className="text-sm font-semibold text-navy underline underline-offset-4">View all photos</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {photos.slice(0, 3).map((g) => (
                <Link key={g.id} to={`/gallery#photo-${g.id}`} className="group relative block overflow-hidden rounded-xl border border-line bg-paper">
                  <img src={g.image_url} alt={g.title ?? "Swave Cups location photo"} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-5 text-xs font-semibold text-white">{g.title ?? "Swave Cups"}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <div className="card space-y-4">
              {s.address && <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden /><div><h3 className="font-bold">Location</h3><p>{s.address}</p></div></div>}
              {s.popup_location && <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden /><div><h3 className="font-bold">Pop-up Location</h3><p>{s.popup_location}</p></div></div>}
              {s.phone && <p className="flex items-center gap-3"><Phone className="h-5 w-5 text-orange" aria-hidden /><a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`}>{s.phone}</a></p>}
              {s.email && <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-orange" aria-hidden /><a href={`mailto:${s.email}`}>{s.email}</a></p>}
              {(s.instagram_url || s.facebook_url) && (
                <div className="flex flex-wrap gap-3">
                  {s.instagram_url && <a className="btn btn-line btn-sm" href={s.instagram_url} target="_blank" rel="noopener noreferrer"><InstagramIcon className="h-4 w-4" /> Instagram</a>}
                  {s.facebook_url && <a className="btn btn-line btn-sm" href={s.facebook_url} target="_blank" rel="noopener noreferrer"><FacebookIcon className="h-4 w-4" /> Facebook</a>}
                </div>
              )}
            </div>
            <HoursPanel hours={s.hours} instagramUrl={s.instagram_url} facebookUrl={s.facebook_url} />
          </div>
          <div className="lg:col-span-3"><LocationMap places={places} className="lg:sticky lg:top-24" /></div>
        </div>
      </Band>
    </>
  );
}
