import type { Product } from "./types";

export type MenuKind = "matcha" | "coffee" | "bites" | "other";

/** Works out what kind of item something is from its category (and name), so we can theme placeholders and power the quiz. */
export function menuKind(categoryName: string | null | undefined, productName = ""): MenuKind {
  const c = (categoryName ?? "").toLowerCase();
  const n = productName.toLowerCase();
  if (/matcha/.test(c)) return "matcha";
  if (/coffee|espresso|latte|brew/.test(c)) return "coffee";
  if (/bite|snack|food|pastry|pastries|cake|meal|sandwich|dessert/.test(c)) return "bites";
  if (/matcha/.test(n)) return "matcha";
  if (/coffee|espresso|latte|americano|cappuccino|mocha/.test(n)) return "coffee";
  return "other";
}

export const kindOf = (p: Pick<Product, "name" | "categories">) => menuKind(p.categories?.name, p.name);
