import { Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth, useProfile } from "@/hooks/use-auth";
import { Sidebar } from "@/components/admin/sidebar";
import { PanelSkeleton } from "@/components/ui/skeletons";

/** Top of the /admin tree: provides auth state to the login page and the panel. */
export function AdminRoot() {
  return <AuthProvider><Outlet /></AuthProvider>;
}

/** Panel shell. Signed-out visitors and accounts without an active admin/staff profile are sent to the login page. */
export function RequireStaff() {
  const { loading, profile } = useAuth();
  if (loading) return <div className="p-8"><PanelSkeleton /></div>;
  if (!profile) return <Navigate to="/admin/login" replace />;
  return <PanelShell />;
}

function PanelShell() {
  const profile = useProfile();
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={profile.role} name={profile.full_name ?? profile.email} />
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></div>
    </div>
  );
}

/** Admin-only pages: staff are sent back to the dashboard with a notice. */
export function RequireAdmin() {
  const profile = useProfile();
  return profile.role === "admin" ? <Outlet /> : <Navigate to="/admin?denied=1" replace />;
}
