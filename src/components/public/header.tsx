import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useCart } from "./cart";

const links = [
  { href: "/menu", label: "Menu" }, { href: "/#visit", label: "Location" }, { href: "/gallery", label: "Gallery" },
  { href: "/#story", label: "About us" }, { href: "/#space", label: "The space" },
];

export function Header({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-extrabold text-navy" onClick={() => setOpen(false)}>
          <img src="/images/logo.jpg" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
          <span>{name.replace(/ Cafe$/i, "")}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Main">
          {links.map((l) => <Link key={l.href} to={l.href} className="hover:text-orange">{l.label}</Link>)}
          <ThemeToggle />
          <Link to="/cart" className="btn btn-solid btn-sm"><ShoppingBag className="h-4 w-4" aria-hidden /> Cart
            <span className="rounded-full bg-butter px-1.5 text-navy-deep" aria-label={`${count} items in cart`}>{count}</span></Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Link to="/cart" className="btn btn-solid btn-sm" aria-label={`Cart, ${count} items`}><ShoppingBag className="h-4 w-4" aria-hidden />{count}</Link>
          <button className="btn btn-line btn-sm" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-cream px-4 py-3 md:hidden" aria-label="Mobile">
          {links.map((l) => <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="block py-2 font-medium">{l.label}</Link>)}
        </nav>
      )}
    </header>
  );
}
