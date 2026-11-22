import type { Product } from "./types";
import { kindOf } from "./menu-kind.ts";

export type Mood = "matcha" | "coffee" | "bites" | "any";
export type Taste = "sweet" | "bold";

const SWEET = /\b(sweet|caramel|mango|vanilla|mocha|chocolate|choco|honey|brown sugar|spanish|creamy|cream|latte|strawberry|berry|syrup|dessert|cake|cookie|brownie|pastry|sugar|milk|fruit|cheesecake|ube|biscoff)\b/g;
const BOLD = /\b(espresso|dirty|americano|black|double|shot|strong|bold|cold brew|ristretto|bitter|earthy|unsweetened|no sugar|ceremonial|savory|savoury|cheese|ham|egg|sandwich|wrap|chips|fries|spicy|salty)\b/g;

const count = (re: RegExp, s: string) => (s.match(re) ?? []).length;

function score(p: Product, taste: Taste): number {
  const text = `${p.name} ${p.short_description ?? ""} ${p.description ?? ""}`.toLowerCase();
  const sweet = count(SWEET, text), bold = count(BOLD, text);
  // The name counts double: "Dirty Matcha" is bold even though its blurb also says "matcha".
  const nameText = p.name.toLowerCase();
  const s = sweet + count(SWEET, nameText), b = bold + count(BOLD, nameText);
  return (taste === "sweet" ? s - b : b - s) + (p.is_featured ? 0.5 : 0);
}

/** Which moods have at least one item, so the quiz never offers a dead end. */
export function availableMoods(products: Product[]): Exclude<Mood, "any">[] {
  const kinds = new Set(products.map(kindOf));
  return (["matcha", "coffee", "bites"] as const).filter((m) => kinds.has(m));
}

/** Best match first. Deterministic, so "Another one" cycles down the list instead of repeating itself. */
export function rankPicks(products: Product[], mood: Mood, taste: Taste): Product[] {
  const pool = mood === "any" ? products : products.filter((p) => kindOf(p) === mood);
  const base = pool.length ? pool : products;
  return [...base].sort((a, b) => score(b, taste) - score(a, taste) || a.name.localeCompare(b.name));
}
