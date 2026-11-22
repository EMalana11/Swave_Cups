import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/public/cart";

/** Wraps every route: shared cart, toasts and scroll handling (top on navigation, #anchors for in-page links). */
export function RootLayout() {
  return (
    <CartProvider>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
      <ScrollRestoration />
    </CartProvider>
  );
}
