import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, UtensilsCrossed, Tags, ClipboardList, Users, Images, ListChecks, Settings, ShieldCheck, LogOut, PanelLeftClose, PanelLeftOpen, Menu, X, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, admin: true },
  { href: "/admin/categories", label: "Categories", icon: Tags, admin: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/gallery", label: "Gallery", icon: Images, admin: true },
  { href: "/admin/project-tracker", label: "Project Tracker", icon: ListChecks, admin: true },
  { href: "/admin/settings", label: "Cafe Settings", icon: Settings, admin: true },
  { href: "/admin/staff", label: "Staff", icon: ShieldCheck, admin: true },
];

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const { pathname: path } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.admin || role === "admin");

  async function handleLogout() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link key={href} to={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} title={label}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", active ? "bg-butter text-navy-deep" : "text-white/80 hover:bg-white/10")}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden /><span className={cn(collapsed && "lg:hidden")}>{label}</span>
          </Link>);
      })}
    </nav>
  );
  const footer = (
    <div className="space-y-1 border-t border-white/10 p-3 text-sm">
      <Link to="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"><ExternalLink className="h-5 w-5 shrink-0" aria-hidden /><span className={cn(collapsed && "lg:hidden")}>View website</span></Link>
      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"><LogOut className="h-5 w-5 shrink-0" aria-hidden /><span className={cn(collapsed && "lg:hidden")}>Log out</span></button>
      <p className={cn("px-3 pt-2 text-xs text-white/50 truncate", collapsed && "lg:hidden")}>{name} · {role}</p>
    </div>
  );
  const brand = (
    <div className="flex items-center gap-2 p-4"><img src="/images/logo.jpg" alt="" width={32} height={32} className="rounded-full" /><span className={cn("font-serif font-bold text-white", collapsed && "lg:hidden")}>Swave Admin</span></div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-navy-deep px-4 py-2 text-white lg:hidden print:hidden">
        <span className="font-serif font-bold">Swave Admin</span>
        <button aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)} className="p-2">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={cn("print:hidden fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy-deep transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width]",
        open ? "translate-x-0 pt-12" : "-translate-x-full lg:pt-0", collapsed ? "lg:w-[4.5rem]" : "lg:w-64")}>
        <div className="hidden lg:block">{brand}</div>
        {nav}{footer}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden items-center justify-center border-t border-white/10 p-3 text-white/70 hover:text-white lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
      </aside>
    </>
  );
}
