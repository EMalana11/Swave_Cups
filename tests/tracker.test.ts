import test from "node:test";
import assert from "node:assert/strict";
import { overallProgress, isOverdue, taskSummary } from "../src/lib/tracker.ts";

const t = (status: string, p: number, due: string | null = null) => ({ status, progress_percent: p, due_date: due });

test("no tasks -> 0, never NaN", () => assert.equal(overallProgress([]), 0));
test("average of task progress", () => assert.equal(overallProgress([t("completed", 100), t("in_progress", 50), t("not_started", 0)]), 50));
test("completed always counts as 100", () => assert.equal(overallProgress([t("completed", 0)]), 100));
test("rounds to whole number", () => assert.equal(overallProgress([t("completed", 100), t("not_started", 0), t("not_started", 0)]), 33));
test("clamps bad values", () => assert.equal(overallProgress([t("in_progress", 250), t("in_progress", -5)]), 50));
test("overdue only when open and past due", () => {
  assert.equal(isOverdue(t("in_progress", 10, "2026-10-01"), "2026-10-30"), true);
  assert.equal(isOverdue(t("completed", 100, "2026-10-01"), "2026-10-30"), false);
  assert.equal(isOverdue(t("not_started", 0, "2026-10-30"), "2026-10-30"), false);
  assert.equal(isOverdue(t("not_started", 0, null), "2026-10-30"), false);
});
test("summary counts", () => {
  const s = taskSummary([t("completed", 100), t("in_progress", 20, "2026-01-01"), t("on_hold", 10)], "2026-10-30");
  assert.deepEqual([s.total, s.completed, s.inProgress, s.onHold, s.overdue, s.percent], [3, 1, 1, 1, 1, 43]);
});
