import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Dices, RotateCcw, Shuffle } from "lucide-react";
import { AddToCartButton, ProductImage } from "./product-ui";
import { availableMoods, rankPicks, type Mood, type Taste } from "@/lib/quiz";
import { kindOf } from "@/lib/menu-kind";
import { cn, peso } from "@/lib/utils";
import type { Product } from "@/lib/types";

const MOODS: Record<Mood, { label: string; emoji: string; hint: string }> = {
  matcha: { label: "Matcha", emoji: "🍵", hint: "green & earthy" },
  coffee: { label: "Coffee", emoji: "☕", hint: "the classic" },
  bites: { label: "A bite", emoji: "🥐", hint: "something to munch" },
  any: { label: "Surprise me", emoji: "🎲", hint: "no preference" },
};

const tasteOptions = (mood: Mood): { value: Taste; label: string; emoji: string; hint: string }[] =>
  mood === "bites"
    ? [{ value: "sweet", label: "Sweet", emoji: "🍯", hint: "a little treat" }, { value: "bold", label: "Savory", emoji: "🧀", hint: "proper snack" }]
    : [{ value: "sweet", label: "Sweet & creamy", emoji: "🍼", hint: "soft and easy" }, { value: "bold", label: "Strong & bold", emoji: "⚡", hint: "wake me up" }];

/** "Can't decide?" — two questions, then one recommendation with a direct Add to cart. */
export function DrinkQuiz({ products, ordersEnabled }: { products: Product[]; ordersEnabled: boolean }) {
  const moods = useMemo(() => availableMoods(products), [products]);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [mood, setMood] = useState<Mood>("any");
  const [taste, setTaste] = useState<Taste>("sweet");
  const [n, setN] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const picks = useMemo(() => (step === 2 ? rankPicks(products, mood, taste) : []), [products, mood, taste, step]);
  const pick = picks.length ? picks[n % picks.length] : null;

  // Move focus to the new question so keyboard and screen-reader users follow along.
  useEffect(() => { if (first.current) { first.current = false; return; } heading.current?.focus(); }, [step]);

  if (products.length === 0) return null;
  const options: Mood[] = [...moods, "any"];
  const restart = () => { setStep(0); setN(0); };

  return (
    <section aria-labelledby="quiz-title" className="mt-10 overflow-hidden rounded-3xl border-2 border-navy bg-butter/50 shadow-[4px_4px_0_0_#2f4486]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-navy/20 bg-butter/70 px-5 py-3">
        <div className="flex items-center gap-2"><Dices className="h-5 w-5 text-navy" aria-hidden /><p className="font-bold text-navy">Can&apos;t decide?</p></div>
        <p className="text-sm font-semibold text-navy/80" aria-live="polite">{step < 2 ? `Question ${step + 1} of 2` : "Your pick"}</p>
      </div>

      <div className="p-5 sm:p-6">
        {step === 0 && (
          <>
            <h3 id="quiz-title" ref={heading} tabIndex={-1} className="text-2xl font-extrabold text-navy outline-none">What are you in the mood for?</h3>
            <p className="mt-1 text-sm">Same. Two quick questions and we&apos;ll pick for you.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {options.map((m) => <Choice key={m} emoji={MOODS[m].emoji} label={MOODS[m].label} hint={MOODS[m].hint} onClick={() => { setMood(m); setStep(1); }} />)}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 id="quiz-title" ref={heading} tabIndex={-1} className="text-2xl font-extrabold text-navy outline-none">{mood === "bites" ? "Sweet or savory?" : "Sweet or strong?"}</h3>
            <p className="mt-1 text-sm">{MOODS[mood].emoji} {mood === "any" ? "Anything goes" : MOODS[mood].label}, got it.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {tasteOptions(mood).map((t) => <Choice key={t.value} emoji={t.emoji} label={t.label} hint={t.hint} onClick={() => { setTaste(t.value); setN(0); setStep(2); }} />)}
            </div>
            <button className="btn btn-ghost btn-sm mt-4" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4" aria-hidden /> Back</button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 id="quiz-title" ref={heading} tabIndex={-1} className="sr-only">Our recommendation</h3>
            {pick ? (
              <div className="grid items-center gap-5 sm:grid-cols-[11rem_1fr]">
                <ProductImage src={pick.image_url} alt={pick.name} kind={kindOf(pick)} className="aspect-square w-full rounded-2xl border-4 border-white shadow" />
                <div>
                  <p className="font-hand text-2xl text-rust">Try the…</p>
                  <p className="text-3xl font-extrabold leading-tight text-navy">{pick.name}</p>
                  <p className="mt-1 text-muted">{pick.short_description || pick.description || "Made with love at Swave Cups."}</p>
                  <p className="mt-2 text-xl font-bold text-navy">{peso(pick.price)}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AddToCartButton product={pick} ordersEnabled={ordersEnabled} className="btn btn-orange" />
                    <Link to={`/menu/${pick.slug}`} className="btn btn-line">See details</Link>
                    {picks.length > 1 && <button className="btn btn-ghost" onClick={() => setN((v) => v + 1)}><Shuffle className="h-4 w-4" aria-hidden /> Another one</button>}
                    <button className="btn btn-ghost" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden /> Start over</button>
                  </div>
                </div>
              </div>
            ) : (
              <p>Nothing on the menu yet — check back soon.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Choice({ emoji, label, hint, onClick }: { emoji: string; label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex flex-col items-center gap-1 rounded-2xl border-2 border-navy/30 bg-white px-3 py-4 text-center transition", "hover:-translate-y-0.5 hover:border-navy hover:shadow-md")}>
      <span aria-hidden className="text-3xl">{emoji}</span>
      <span className="font-bold text-navy">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>
  );
}
