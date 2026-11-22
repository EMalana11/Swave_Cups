export interface ProgressTask { status: string; progress_percent: number; due_date: string | null }

/**
 * Overall project completion = average of every task's progress_percent, rounded to a whole number.
 *  - A Completed task always counts as 100 (the database also forces this).
 *  - Tasks "On Hold" still count, at their current percentage, so pausing work never inflates progress.
 *  - With no tasks the result is 0 (never NaN / divide-by-zero).
 */
export function overallProgress(tasks: ProgressTask[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, t) => sum + (t.status === "completed" ? 100 : clamp(t.progress_percent)), 0);
  return Math.round(total / tasks.length);
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);

/** A task is overdue when it is not completed and its due date (YYYY-MM-DD) is before today (YYYY-MM-DD). */
export function isOverdue(t: Pick<ProgressTask, "status" | "due_date">, today: string): boolean {
  return t.status !== "completed" && !!t.due_date && t.due_date < today;
}

export function taskSummary(tasks: ProgressTask[], today: string) {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    onHold: tasks.filter((t) => t.status === "on_hold").length,
    notStarted: tasks.filter((t) => t.status === "not_started").length,
    overdue: tasks.filter((t) => isOverdue(t, today)).length,
    percent: overallProgress(tasks),
  };
}
