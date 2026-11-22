import test from "node:test";
import assert from "node:assert/strict";
import { groupAlbums, albumYears, albumTitle, photoCount } from "../src/lib/gallery.ts";
import { getOpenStatus, summarizeHours, fmtTime, hasHours } from "../src/lib/hours.ts";
import { rankPicks, availableMoods } from "../src/lib/quiz.ts";
import { menuKind } from "../src/lib/menu-kind.ts";
import { popupQuery, directionsUrl, safeHttps } from "../src/lib/maps.ts";

/* ---------- gallery albums ---------- */
const g = (id: string, photo_date: string, sort_order: number, title: string | null = null) =>
  ({ id, title, description: null, image_url: `/${id}.jpg`, storage_path: null, photo_date, sort_order, is_published: true });

test("photos group into one album per month, newest first", () => {
  const albums = groupAlbums([g("a", "2026-09-28", 1, "Two lattes"), g("b", "2026-08-02", 1), g("c", "2026-09-03", 2, "Beanbag afternoons"), g("d", "2025-12-25", 1)]);
  assert.deepEqual(albums.map((a) => a.key), ["2026-09", "2026-08", "2025-12"]);
  assert.equal(albums[0].images.length, 2);
  assert.equal(albums[0].label, "September 2026");
  assert.equal(albums[0].shortLabel, "Sep 2026");
});
test("album photos flip chronologically; cover is the admin's first pick", () => {
  const [a] = groupAlbums([g("late", "2026-09-28", 1), g("early", "2026-09-03", 5)]);
  assert.deepEqual(a.images.map((i) => i.id), ["early", "late"]);
  assert.equal(a.cover.id, "late");
});
test("years are unique and newest first", () => {
  assert.deepEqual(albumYears(groupAlbums([g("a", "2024-01-01", 1), g("b", "2026-02-01", 1), g("c", "2026-03-01", 1), g("d", "2025-03-01", 1)])), ["2026", "2025", "2024"]);
});
test("album title uses up to two distinct photo titles, with a fallback", () => {
  assert.equal(albumTitle([g("a", "2026-09-01", 1, "beanbag afternoons"), g("b", "2026-09-02", 1, "Beanbag Afternoons"), g("c", "2026-09-03", 1, "Pop-up launch"), g("d", "2026-09-04", 1, "Third")]), "Beanbag Afternoons & Pop-up Launch");
  assert.equal(albumTitle([g("a", "2026-09-01", 1)]), "Cafe memories");
});
test("bad dates are skipped instead of crashing; empty input gives no albums", () => {
  assert.deepEqual(groupAlbums([g("x", "nope", 1)]), []);
  assert.deepEqual(groupAlbums([]), []);
});
test("photo count pluralises", () => { assert.equal(photoCount(1), "1 photo"); assert.equal(photoCount(12), "12 photos"); });

/* ---------- opening hours ---------- */
const row = (day: string, open: string, close: string, closed = false) => ({ day, open, close, closed });
const WEEK = [row("Monday", "", "", true), ...["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => row(d, "15:00", "22:00"))];
// 2026-11-03 is a Tuesday. Manila is UTC+8, so 16:00 Manila = 08:00Z.
const at = (iso: string) => new Date(iso);

test("time formatting", () => { assert.equal(fmtTime("15:00"), "3:00 PM"); assert.equal(fmtTime("00:30"), "12:30 AM"); assert.equal(fmtTime("12:00"), "12:00 PM"); });
test("open during opening hours, with closing time", () => {
  const s = getOpenStatus(WEEK, at("2026-11-03T08:00:00Z")); // Tue 16:00 Manila
  assert.equal(s.state, "open"); assert.equal(s.detail, "Until 10:00 PM");
});
test("closed before opening, says when it opens today", () => {
  const s = getOpenStatus(WEEK, at("2026-11-03T02:00:00Z")); // Tue 10:00 Manila
  assert.equal(s.state, "closed"); assert.equal(s.detail, "Opens today at 3:00 PM");
});
test("closed after closing, opens tomorrow", () => {
  const s = getOpenStatus(WEEK, at("2026-11-03T15:00:00Z")); // Tue 23:00 Manila
  assert.equal(s.state, "closed"); assert.equal(s.detail, "Opens tomorrow at 3:00 PM");
});
test("closed day looks ahead to the next open day", () => {
  const s = getOpenStatus(WEEK, at("2026-11-02T08:00:00Z")); // Mon 16:00 Manila
  assert.equal(s.state, "closed"); assert.equal(s.detail, "Opens tomorrow at 3:00 PM");
});
test("uses Manila time, not the server's: 20:00Z Tuesday is already Wednesday 04:00 in Manila", () => {
  const s = getOpenStatus(WEEK, at("2026-11-03T20:00:00Z"));
  assert.equal(s.todayIndex, 2); // Wednesday
});
test("late closing past midnight stays open into the next morning", () => {
  const late = WEEK.map((h) => (h.closed ? h : { ...h, open: "18:00", close: "01:00" }));
  assert.equal(getOpenStatus(late, at("2026-11-03T16:30:00Z")).state, "open"); // Wed 00:30 Manila, Tuesday's shift
  assert.equal(getOpenStatus(late, at("2026-11-03T12:00:00Z")).state, "open"); // Tue 20:00 Manila
  assert.equal(getOpenStatus(late, at("2026-11-03T18:00:00Z")).state, "closed"); // Wed 02:00 Manila
});
test("no hours set -> unknown, never claims open or closed", () => {
  assert.equal(getOpenStatus([], at("2026-11-03T08:00:00Z")).state, "unknown");
  assert.equal(hasHours([]), false);
  assert.equal(hasHours(WEEK), true);
});
test("hours summary collapses runs of identical days", () => {
  assert.deepEqual(summarizeHours(WEEK), [{ days: "Mon", text: "Closed", closed: true }, { days: "Tue–Sun", text: "3:00 PM – 10:00 PM", closed: false }]);
});

/* ---------- drink quiz ---------- */
const p = (name: string, cat: string, short = "", featured = false) =>
  ({ id: name, category_id: cat, name, slug: name, short_description: short, description: null, price: 100, image_url: null, image_path: null, is_active: true, is_featured: featured, created_at: "", categories: { name: cat } });
const MENU = [
  p("Matcha Latte", "Matcha Series", "Classic creamy matcha latte.", true), p("Mango Matcha", "Matcha Series", "Matcha with mango flavor.", true), p("Dirty Matcha", "Matcha Series", "Matcha with a shot of espresso."),
  p("Americano", "Coffee", "Black coffee, strong."), p("Caramel Latte", "Coffee", "Sweet caramel and milk."), p("Cheese Sandwich", "Bites", "Savory toasted sandwich."), p("Choco Cookie", "Bites", "Sweet chocolate cookie."),
];
test("quiz: strong matcha is the dirty one, sweet matcha is not", () => {
  assert.equal(rankPicks(MENU, "matcha", "bold")[0].name, "Dirty Matcha");
  assert.notEqual(rankPicks(MENU, "matcha", "sweet")[0].name, "Dirty Matcha");
});
test("quiz: stays inside the chosen mood", () => {
  assert.ok(rankPicks(MENU, "coffee", "sweet").every((x) => x.categories?.name === "Coffee"));
  assert.equal(rankPicks(MENU, "coffee", "sweet")[0].name, "Caramel Latte");
  assert.equal(rankPicks(MENU, "coffee", "bold")[0].name, "Americano");
  assert.equal(rankPicks(MENU, "bites", "bold")[0].name, "Cheese Sandwich");
  assert.equal(rankPicks(MENU, "bites", "sweet")[0].name, "Choco Cookie");
});
test("quiz: only offers moods that exist, and falls back when a mood is empty", () => {
  assert.deepEqual(availableMoods(MENU.filter((x) => x.categories?.name !== "Bites")), ["matcha", "coffee"]);
  assert.ok(rankPicks(MENU.filter((x) => x.categories?.name === "Coffee"), "matcha", "sweet").length > 0);
  assert.deepEqual(rankPicks([], "any", "sweet"), []);
});
test("quiz: ranking is stable so 'another one' cycles instead of repeating", () => {
  const a = rankPicks(MENU, "matcha", "sweet").map((x) => x.name);
  assert.deepEqual(a, rankPicks(MENU, "matcha", "sweet").map((x) => x.name));
  assert.equal(new Set(a).size, a.length);
});
test("menu kinds", () => {
  assert.equal(menuKind("Matcha Series"), "matcha"); assert.equal(menuKind("Coffee"), "coffee"); assert.equal(menuKind("Bites"), "bites");
  assert.equal(menuKind("Specials", "Iced Matcha"), "matcha"); assert.equal(menuKind(null, "Thing"), "other");
});

/* ---------- maps ---------- */
test("pop-up search borrows the town from the address", () => {
  assert.equal(popupQuery("Canaman Boulevard", "Progress Homes, 2nd Street Left, San Vicente, Canaman, Camarines Sur"), "Canaman Boulevard, Canaman, Camarines Sur");
  assert.equal(popupQuery("Canaman Boulevard, Camarines Sur", "A, B, Canaman, Camarines Sur"), "Canaman Boulevard, Camarines Sur");
  assert.equal(popupQuery("Plaza", null), "Plaza");
});
test("directions url is encoded; only https links are trusted", () => {
  assert.ok(directionsUrl("A & B, Canaman").includes("destination=A%20%26%20B%2C%20Canaman"));
  assert.equal(safeHttps("https://maps.app.goo.gl/x"), "https://maps.app.goo.gl/x");
  assert.equal(safeHttps("javascript:alert(1)"), null); assert.equal(safeHttps(null), null);
});
