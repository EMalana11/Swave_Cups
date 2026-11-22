import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { TASK_SORTS, addTaskNote, deleteTask, fetchTaskOverview, fetchTasks, setTaskDone } from "@/api/tracker";
import { FilterForm } from "@/components/admin/filter-form";
import { PageHeader, StatCard } from "@/components/admin/page-header";
import { PRIORITY_LABEL, STATUS_LABEL, TaskForm } from "@/components/admin/task-form";
import { Async } from "@/components/ui/async";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/ui/form";
import { EmptyState, Pagination, ProgressBar } from "@/components/ui/misc";
import { usePageTitle } from "@/hooks/use-page-title";
import { pageRange, parsePage, safeSearch } from "@/lib/paging";
import { isOverdue, taskSummary } from "@/lib/tracker";
import { cn, fmtDate, fmtDateTime, todayManila } from "@/lib/utils";

const PER_PAGE = 20;
const STATUS_COLOR = { not_started: "bg-stone-200 text-stone-700", in_progress: "bg-sky-100 text-sky-800", completed: "bg-green-200 text-green-900", on_hold: "bg-amber-100 text-amber-800" };
const PRIORITY_COLOR = { low: "bg-stone-100 text-stone-600", medium: "bg-blue-100 text-blue-800", high: "bg-orange/20 text-rust", urgent: "bg-red-100 text-red-700" };

/** Returns the value only if it is one of the allowed keys, so a hand-edited URL can't send junk to the database. */
const oneOf = (value: string | null, allowed: object, extra: string[] = []) =>
  value && (value in allowed || extra.includes(value)) ? value : undefined;

export default function ProjectTrackerPage() {
  usePageTitle("Project Tracker", "Admin");
  const [params] = useSearchParams();
  const today = todayManila();
  const q = safeSearch(params.get("q"));
  const status = oneOf(params.get("status"), STATUS_LABEL, ["overdue"]);
  const priority = oneOf(params.get("priority"), PRIORITY_LABEL);
  const category = params.get("category")?.slice(0, 80) || undefined;
  const sort = oneOf(params.get("sort"), TASK_SORTS) ?? "due";
  const page = parsePage(params.get("page"));

  const overview = useQuery({ queryKey: ["admin", "tracker", "overview"], queryFn: fetchTaskOverview });
  const list = useQuery({
    queryKey: ["admin", "tracker", "tasks", { q, status, priority, category, sort, page }],
    queryFn: () => fetchTasks({ q, status, priority, category, sort, today, ...pageRange(page, PER_PAGE) }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Project Progress Tracker" subtitle="Cafe website & ordering system — development tasks (not customer orders)." />
      <Async query={overview}>
        {(all) => {
          // Overall numbers always come from ALL tasks, never from the filtered page.
          const sum = taskSummary(all, today);
          const categories = [...new Set(all.map((t) => t.category))].sort();
          return (
            <>
              <section className="card mb-6" aria-label="Project summary">
                <div className="flex items-end justify-between">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Overall completion</p><p className="text-4xl font-extrabold text-orange">{sum.percent}%</p></div>
                  <p className="max-w-xs text-right text-xs text-muted">Average progress of all {sum.total} tasks. Completed tasks count as 100%; with no tasks the result is 0%.</p>
                </div>
                <ProgressBar value={sum.percent} className="mt-3 h-4" label="Overall project completion" />
              </section>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total tasks" value={sum.total} />
                <StatCard label="Completed" value={sum.completed} tone="green" />
                <StatCard label="In progress" value={sum.inProgress} tone="orange" />
                <StatCard label="Overdue" value={sum.overdue} tone="red" hint={sum.onHold ? `${sum.onHold} on hold` : undefined} />
              </div>

              <details className="card mb-6" open={sum.total === 0}>
                <summary className="flex cursor-pointer items-center gap-2 font-bold"><Plus className="h-4 w-4" aria-hidden /> Add a task</summary>
                <div className="mt-4"><TaskForm categories={categories} /></div>
              </details>

              <FilterForm className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-2"><label className="label" htmlFor="q">Search</label><input id="q" name="q" className="input" defaultValue={q} placeholder="Title or description" /></div>
                <div><label className="label" htmlFor="status">Status</label>
                  <select id="status" name="status" className="input" defaultValue={status ?? ""}><option value="">All</option>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}<option value="overdue">Overdue</option></select></div>
                <div><label className="label" htmlFor="priority">Priority</label>
                  <select id="priority" name="priority" className="input" defaultValue={priority ?? ""}><option value="">All</option>{Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className="label" htmlFor="category">Phase</label>
                  <select id="category" name="category" className="input" defaultValue={category ?? ""}><option value="">All</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label" htmlFor="sort">Sort by</label>
                  <select id="sort" name="sort" className="input" defaultValue={sort}>{Object.entries(TASK_SORTS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}</select></div>
                <div className="sm:col-span-2 lg:col-span-6"><button className="btn btn-solid">Apply</button></div>
              </FilterForm>

              <Async query={list} errorMessage="Could not load tasks. Make sure the migrations were applied, then refresh.">
                {({ tasks, history, count }) => (
                  <>
                    {tasks.length === 0 ? (
                      <EmptyState title={sum.total === 0 ? "No tasks yet" : "No tasks match these filters"}>{sum.total === 0 ? "Add your first task above." : "Clear the filters to see everything."}</EmptyState>
                    ) : (
                      <ul className="space-y-3">
                        {tasks.map((t) => {
                          const late = isOverdue(t, today);
                          const notes = history.get(t.id) ?? [];
                          return (
                            <li key={t.id} className={cn("card", late && "border-red-300")}>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`badge ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                                    <span className={`badge ${PRIORITY_COLOR[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                                    {late && <span className="badge bg-red-100 text-red-700"><AlertTriangle className="mr-1 h-3 w-3" aria-hidden /> Overdue</span>}
                                    <span className="text-xs text-muted">{t.category}</span>
                                  </div>
                                  <h3 className={cn("mt-1 font-sans text-base font-semibold", t.status === "completed" && "text-muted line-through")}>{t.title}</h3>
                                  {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
                                  <p className="mt-1 text-xs text-muted">{t.start_date ? `Start ${fmtDate(t.start_date)}` : "No start date"} · {t.due_date ? `Due ${fmtDate(t.due_date)}` : "No due date"}</p>
                                </div>
                                <div className="flex gap-2">
                                  <ActionForm action={setTaskDone}>
                                    <input type="hidden" name="id" value={t.id} /><input type="hidden" name="to" value={t.status === "completed" ? "reopen" : "complete"} />
                                    <SubmitButton className="btn btn-line btn-sm">{t.status === "completed" ? <><RotateCcw className="h-3 w-3" aria-hidden /> Reopen</> : <><CheckCircle2 className="h-3 w-3" aria-hidden /> Complete</>}</SubmitButton>
                                  </ActionForm>
                                  <ActionForm action={deleteTask}>
                                    <input type="hidden" name="id" value={t.id} />
                                    <ConfirmButton title="Delete this task?" message={`“${t.title}” and its history will be permanently deleted.`}><Trash2 className="h-3 w-3" aria-hidden /> Delete</ConfirmButton>
                                  </ActionForm>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-3"><ProgressBar value={t.progress_percent} label={`Progress of ${t.title}`} /><span className="w-10 text-right text-sm font-semibold">{t.progress_percent}%</span></div>
                              <details className="mt-3 text-sm">
                                <summary className="cursor-pointer font-semibold text-navy">Edit, notes &amp; history ({notes.length})</summary>
                                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                                  <TaskForm task={t} categories={categories} />
                                  <div>
                                    <ActionForm action={addTaskNote} resetOnSuccess className="mb-4 space-y-2">
                                      <input type="hidden" name="task_id" value={t.id} />
                                      <Field label="Add an update note" name="note" id={`note-${t.id}`}><textarea id={`note-${t.id}`} name="note" rows={2} maxLength={1000} className="input" /></Field>
                                      <SubmitButton className="btn btn-line btn-sm">Add note</SubmitButton>
                                    </ActionForm>
                                    {notes.length === 0 ? <p className="text-muted">No history yet.</p> : (
                                      <ol className="max-h-64 space-y-2 overflow-y-auto">
                                        {notes.map((a) => (
                                          <li key={a.id} className="rounded-lg bg-cream p-2">
                                            <p className="text-xs text-muted">{fmtDateTime(a.created_at)} · {a.actor_email ?? "system"} · {a.action}</p>
                                            {a.detail && <p>{a.detail}</p>}
                                          </li>
                                        ))}
                                      </ol>
                                    )}
                                  </div>
                                </div>
                              </details>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Pagination page={page} pages={Math.ceil(count / PER_PAGE)} basePath="/admin/project-tracker" params={{ q, status, priority, category, sort }} />
                  </>
                )}
              </Async>
            </>
          );
        }}
      </Async>
    </>
  );
}
