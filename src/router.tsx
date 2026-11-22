import type { ComponentType } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AdminRoot, RequireAdmin, RequireStaff } from "@/components/layout/admin-layout";
import { NotFound } from "@/components/layout/not-found";
import { RootLayout } from "@/components/layout/root-layout";
import { RouteError } from "@/components/layout/route-error";
import { SiteLayout } from "@/components/layout/site-layout";

import CartPage from "@/pages/public/cart";
import CheckoutPage from "@/pages/public/checkout";
import GalleryPage from "@/pages/public/gallery";
import Home from "@/pages/public/home";
import MenuPage from "@/pages/public/menu";
import OrderSuccessPage from "@/pages/public/order-success";
import ProductPage from "@/pages/public/product";

/** Admin pages load on demand, so visitors to the public site never download the dashboard code. */
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

const adminAndStaffRoutes: RouteObject[] = [
  { index: true, lazy: lazyPage(() => import("@/pages/admin/dashboard")) },
  { path: "orders", lazy: lazyPage(() => import("@/pages/admin/orders")) },
  { path: "orders/:id", lazy: lazyPage(() => import("@/pages/admin/order-detail")) },
  { path: "orders/:id/receipt", lazy: lazyPage(() => import("@/pages/admin/receipt")) },
  { path: "customers", lazy: lazyPage(() => import("@/pages/admin/customers")) },
  { path: "customers/:id", lazy: lazyPage(() => import("@/pages/admin/customer-detail")) },
];

const adminOnlyRoutes: RouteObject[] = [
  { path: "menu", lazy: lazyPage(() => import("@/pages/admin/menu-list")) },
  { path: "menu/new", lazy: lazyPage(() => import("@/pages/admin/product-new")) },
  { path: "menu/:id", lazy: lazyPage(() => import("@/pages/admin/product-edit")) },
  { path: "categories", lazy: lazyPage(() => import("@/pages/admin/categories")) },
  { path: "gallery", lazy: lazyPage(() => import("@/pages/admin/gallery")) },
  { path: "project-tracker", lazy: lazyPage(() => import("@/pages/admin/project-tracker")) },
  { path: "settings", lazy: lazyPage(() => import("@/pages/admin/settings")) },
  { path: "staff", lazy: lazyPage(() => import("@/pages/admin/staff")) },
];

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "gallery", element: <GalleryPage /> },
          { path: "menu/:slug", element: <ProductPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "order-success", element: <OrderSuccessPage /> },
        ],
      },
      // The full menu is a standalone, app-like page: no site header/footer, but it shares the cart.
      { path: "menu", element: <MenuPage /> },
      {
        path: "admin",
        element: <AdminRoot />,
        children: [
          { path: "login", lazy: lazyPage(() => import("@/pages/admin/login")) },
          {
            element: <RequireStaff />,
            children: [
              ...adminAndStaffRoutes,
              { element: <RequireAdmin />, children: adminOnlyRoutes },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
