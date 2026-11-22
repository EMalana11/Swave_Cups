import { supabase, unwrap } from "@/lib/supabase";
import { taskSummary } from "@/lib/tracker";
import { todayManila } from "@/lib/utils";
import type { DashboardStats, ProjectTask } from "@/lib/types";

export async function fetchDashboard(isAdmin: boolean) {
  const stats = unwrap(await supabase.rpc("admin_dashboard_stats")) as DashboardStats;
  if (!isAdmin) return { stats, tracker: null };
  const tasks = unwrap(await supabase.from("project_tasks").select("status, progress_percent, due_date")) as ProjectTask[];
  return { stats, tracker: taskSummary(tasks, todayManila()) };
}
