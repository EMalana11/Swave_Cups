import { supabase, unwrap } from "@/lib/supabase";
import { fieldErrors, idSchema, taskSchema } from "@/lib/validation";
import { dbMessage, done, fail } from "@/lib/utils";
import type { ActionState, ProjectTask, TaskActivity } from "@/lib/types";

export const TASK_SORTS: Record<string, { column: string; ascending: boolean; label: string }> = {
  due: { column: "due_date", ascending: true, label: "Due date" },
  priority: { column: "priority", ascending: false, label: "Priority (high first)" },
  progress: { column: "progress_percent", ascending: false, label: "Progress" },
  updated: { column: "updated_at", ascending: false, label: "Recently updated" },
  created: { column: "created_at", ascending: false, label: "Newest" },
};

export interface TaskFilters { q: string; status?: string; priority?: string; category?: string; sort: string; today: string; from: number; to: number }

/** Compact rows of ALL tasks: overall numbers must never depend on the filtered page. */
export async function fetchTaskOverview(): Promise<Pick<ProjectTask, "status" | "progress_percent" | "due_date" | "category">[]> {
  return unwrap(await supabase.from("project_tasks").select("status, progress_percent, due_date, category").limit(5000));
}

export async function fetchTasks({ q, status, priority, category, sort, today, from, to }: TaskFilters) {
  let query = supabase.from("project_tasks").select("*", { count: "exact" }).range(from, to);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (status === "overdue") query = query.neq("status", "completed").lt("due_date", today);
  else if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (category) query = query.eq("category", category.slice(0, 80));
  const { column, ascending } = TASK_SORTS[sort];
  query = query.order(column, { ascending, nullsFirst: false }).order("created_at", { ascending: false });

  const { data, count, error } = await query;
  if (error) throw error;
  const tasks = (data ?? []) as ProjectTask[];

  const history = new Map<string, TaskActivity[]>();
  if (tasks.length) {
    const rows = unwrap(await supabase.from("project_task_activity").select("*").in("task_id", tasks.map((t) => t.id)).order("created_at", { ascending: false }).limit(300)) as TaskActivity[];
    for (const a of rows) history.set(a.task_id, [...(history.get(a.task_id) ?? []), a]);
  }
  return { tasks, history, count: count ?? 0 };
}

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

export async function saveTask(fd: FormData): Promise<ActionState> {
  const parsed = taskSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const id = String(fd.get("id") ?? "");
  const { error } = id
    ? await supabase.from("project_tasks").update(parsed.data).eq("id", idSchema.parse(id))
    : await supabase.from("project_tasks").insert({ ...parsed.data, created_by: (await currentUser()).id });
  return error ? fail(dbMessage(error)) : done(id ? "Task updated." : "Task created.");
}

/** Complete (→100%) or reopen (→ In Progress at 0%). A DB trigger keeps status and progress consistent. */
export async function setTaskDone(fd: FormData): Promise<ActionState> {
  const completing = fd.get("to") === "complete";
  const patch = completing ? { status: "completed", progress_percent: 100 } : { status: "in_progress", progress_percent: 0 };
  const { error } = await supabase.from("project_tasks").update(patch).eq("id", idSchema.parse(fd.get("id")));
  return error ? fail(dbMessage(error)) : done(completing ? "Task completed." : "Task reopened.");
}

export async function deleteTask(fd: FormData): Promise<ActionState> {
  const { error } = await supabase.from("project_tasks").delete().eq("id", idSchema.parse(fd.get("id")));
  return error ? fail(dbMessage(error)) : done("Task deleted.");
}

export async function addTaskNote(fd: FormData): Promise<ActionState> {
  const note = String(fd.get("note") ?? "").trim();
  if (!note) return fail("Write a note first.");
  if (note.length > 1000) return fail("Notes can be up to 1000 characters.");
  const user = await currentUser();
  const { error } = await supabase.from("project_task_activity").insert({
    task_id: idSchema.parse(fd.get("task_id")), actor_id: user.id, actor_email: user.email, action: "note", detail: note,
  });
  return error ? fail(dbMessage(error)) : done("Note added.");
}
