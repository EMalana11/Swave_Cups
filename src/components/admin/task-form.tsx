import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { saveTask } from "@/api/tracker";
import type { ProjectTask } from "@/lib/types";

export const STATUS_LABEL = { not_started: "Not Started", in_progress: "In Progress", completed: "Completed", on_hold: "On Hold" } as const;
export const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" } as const;

export function TaskForm({ task, categories }: { task?: ProjectTask; categories: string[] }) {
  const k = task?.id ?? "new";
  return (
    <ActionForm action={saveTask} resetOnSuccess={!task} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}
      <Field label="Title *" name="title" id={`title-${k}`}><input id={`title-${k}`} name="title" required maxLength={200} className="input" defaultValue={task?.title} /></Field>
      <Field label="Description" name="description" id={`desc-${k}`}><textarea id={`desc-${k}`} name="description" rows={3} maxLength={2000} className="input" defaultValue={task?.description ?? ""} /></Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Status" name="status" id={`status-${k}`}><select id={`status-${k}`} name="status" className="input" defaultValue={task?.status ?? "not_started"}>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Priority" name="priority" id={`prio-${k}`}><select id={`prio-${k}`} name="priority" className="input" defaultValue={task?.priority ?? "medium"}>{Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Category / phase *" name="category" id={`cat-${k}`}><input id={`cat-${k}`} name="category" list={`cats-${k}`} required maxLength={80} className="input" defaultValue={task?.category ?? ""} /><datalist id={`cats-${k}`}>{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
        <Field label="Progress (%)" name="progress_percent" id={`pct-${k}`} hint="100% marks it Completed."><input id={`pct-${k}`} name="progress_percent" type="number" min={0} max={100} step={5} className="input" defaultValue={task?.progress_percent ?? 0} /></Field>
        <Field label="Start date" name="start_date" id={`sd-${k}`}><input id={`sd-${k}`} name="start_date" type="date" className="input" defaultValue={task?.start_date ?? ""} /></Field>
        <Field label="Due date" name="due_date" id={`dd-${k}`}><input id={`dd-${k}`} name="due_date" type="date" className="input" defaultValue={task?.due_date ?? ""} /></Field>
      </div>
      <Field label="Notes" name="notes" id={`notes-${k}`}><textarea id={`notes-${k}`} name="notes" rows={2} maxLength={2000} className="input" defaultValue={task?.notes ?? ""} /></Field>
      <SubmitButton pendingText="Saving…">{task ? "Save task" : "Create task"}</SubmitButton>
    </ActionForm>
  );
}
