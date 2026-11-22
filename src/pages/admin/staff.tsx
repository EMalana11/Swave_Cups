import { useQuery } from "@tanstack/react-query";
import { addStaff, fetchStaff, updateStaff } from "@/api/staff";
import { PageHeader } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { fmtDate } from "@/lib/utils";

export default function StaffPage() {
  usePageTitle("Staff", "Admin");
  const { userId } = useAuth();
  const query = useQuery({ queryKey: ["admin", "staff"], queryFn: fetchStaff });

  return (
    <>
      <PageHeader title="Staff accounts" subtitle="Admins manage everything. Staff can only work with orders and view customers." />
      <ActionForm action={addStaff} resetOnSuccess className="card mb-6 grid items-start gap-3 md:grid-cols-[2fr_2fr_1fr_auto]">
        <Field label="Email of an existing login *" name="email" hint="Create the user first in Supabase → Authentication → Users."><input id="email" name="email" type="email" required className="input" /></Field>
        <Field label="Full name" name="full_name"><input id="full_name" name="full_name" maxLength={100} className="input" /></Field>
        <Field label="Role" name="role"><select id="role" name="role" className="input" defaultValue="staff"><option value="staff">Staff</option><option value="admin">Admin</option></select></Field>
        <div className="md:pt-6"><SubmitButton pendingText="Linking…">Grant access</SubmitButton></div>
      </ActionForm>

      <Async query={query}>
        {(people) => (
          <ul className="space-y-3">
            {people.map((p) => {
              const isYou = p.id === userId; // you can't demote or deactivate yourself
              return (
                <li key={p.id} className="card">
                  <ActionForm action={updateStaff} className="flex flex-wrap items-center gap-4">
                    <input type="hidden" name="id" value={p.id} />
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold">{p.full_name ?? p.email}{isYou && <span className="badge ml-2 bg-butter text-navy-deep">You</span>}</p>
                      <p className="text-sm text-muted">{p.email} · added {fmtDate(p.created_at)}</p>
                    </div>
                    <select name="role" aria-label={`Role of ${p.email}`} className="input w-32" defaultValue={p.role} disabled={isYou}><option value="staff">Staff</option><option value="admin">Admin</option></select>
                    {isYou && <input type="hidden" name="role" value="admin" />}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={p.is_active} disabled={isYou} />Active</label>
                    {isYou && <input type="hidden" name="is_active" value="on" />}
                    <SubmitButton className="btn btn-line btn-sm">Save</SubmitButton>
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        )}
      </Async>
    </>
  );
}
