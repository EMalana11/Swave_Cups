import { createContext, useContext, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn, fail } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

interface FormState { errors: Record<string, string>; pending: boolean }
const FormContext = createContext<FormState>({ errors: {}, pending: false });

interface ActionFormProps {
  /** Receives the submitted form data and answers with success/failure (see `done` / `fail`). */
  action: (formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  redirectTo?: string;
  /** Only toast failures; successes are visible on screen already. */
  silent?: boolean;
}

/** A form that runs an async action, shows toasts and field errors, and refreshes the page data after a success. */
export function ActionForm({ action, children, className, resetOnSuccess, redirectTo, silent }: ActionFormProps) {
  const [state, setState] = useState<ActionState>({ ok: false });
  const [pending, setPending] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;

    setPending(true);
    let result: ActionState;
    try {
      result = await action(new FormData(form));
    } catch (error) {
      console.error("[action]", error);
      result = fail("Something went wrong. Please try again.");
    }
    setPending(false);
    setState(result);

    if (result.message && (!silent || !result.ok)) (result.ok ? toast.success : toast.error)(result.message);
    if (!result.ok) return;

    if (resetOnSuccess) form.reset();
    await queryClient.invalidateQueries();
    if (redirectTo) navigate(redirectTo);
  }

  return (
    <FormContext.Provider value={{ errors: state.errors ?? {}, pending }}>
      <form onSubmit={handleSubmit} className={className}>{children}</form>
    </FormContext.Provider>
  );
}

interface FieldProps { label: string; name: string; id?: string; hint?: string; children: ReactNode; className?: string }

export function Field({ label, name, id, hint, children, className }: FieldProps) {
  const error = useContext(FormContext).errors[name];
  return (
    <div className={className}>
      <label htmlFor={id ?? name} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

interface SubmitButtonProps { children: ReactNode; className?: string; pendingText?: string }

export function SubmitButton({ children, className = "btn btn-solid", pendingText }: SubmitButtonProps) {
  const { pending } = useContext(FormContext);
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

interface ConfirmButtonProps {
  children: ReactNode; title: string; message: string; confirmLabel?: string; className?: string; danger?: boolean;
}

/** Opens a confirmation dialog; submits the surrounding form only after the user confirms. */
export function ConfirmButton({ children, title, message, confirmLabel = "Delete", className = "btn btn-line btn-sm", danger = true }: ConfirmButtonProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const { pending } = useContext(FormContext);

  return (
    <>
      <button type="button" className={className} disabled={pending} onClick={() => dialog.current?.showModal()}>{children}</button>
      <dialog ref={dialog} className="w-[min(92vw,26rem)] rounded-2xl p-0 shadow-xl backdrop:bg-black/40" aria-labelledby={titleId}>
        <div className="p-6">
          <h3 id={titleId} className="text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-muted">{message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-line btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
            <button ref={confirm} type="button" className={cn("btn btn-sm", danger ? "btn-danger" : "btn-solid")}
              onClick={() => { dialog.current?.close(); confirm.current?.closest("form")?.requestSubmit(); }}>{confirmLabel}</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
