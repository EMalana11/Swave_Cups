import { Navigate } from "react-router-dom";
import { login } from "@/api/auth";
import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";

export default function LoginPage() {
  usePageTitle("Admin sign in");
  const { profile } = useAuth();
  if (profile) return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="card w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/images/logo.jpg" alt="Swave Cups Cafe" width={72} height={72} className="mx-auto rounded-full" />
          <h1 className="mt-3 text-2xl font-extrabold text-navy">Admin sign in</h1>
          <p className="text-sm text-muted">Authorized staff only</p>
        </div>
        <ActionForm action={login} redirectTo="/admin" className="space-y-4" silent>
          <Field label="Email" name="email"><input id="email" name="email" type="email" required autoComplete="username" className="input" /></Field>
          <Field label="Password" name="password"><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></Field>
          <SubmitButton className="btn btn-solid w-full" pendingText="Signing in…">Sign in</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
