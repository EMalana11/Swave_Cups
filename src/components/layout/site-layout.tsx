import { Outlet } from "react-router-dom";
import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { useSettings } from "@/hooks/queries";

/** Public pages: header, footer and a skip link around the page content. */
export function SiteLayout() {
  const { settings } = useSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <Header name={settings.cafe_name} />
      <main id="main"><Outlet /></main>
      <Footer s={settings} />
    </>
  );
}
