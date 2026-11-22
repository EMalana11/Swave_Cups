import { Link } from "react-router-dom";
import { FullMenu, type MenuGroup } from "@/components/public/full-menu";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useMenu, useSettings } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/use-page-title";

export default function MenuPage() {
  usePageTitle("Our Menu");
  const menu = useMenu();
  const { settings, ready } = useSettings();

  if (menu.isPending || !ready) return <PageSkeleton />;

  if (menu.isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center text-ink">
        <div>
          <p className="text-lg font-semibold">We couldn&apos;t load the menu right now.</p>
          <button type="button" onClick={() => menu.refetch()} className="btn btn-solid mt-4">Try again</button>
          <Link to="/" className="btn btn-line ml-2 mt-4">Back home</Link>
        </div>
      </div>
    );
  }

  // One section per category (in the admin's sort order); empty categories are skipped.
  const groups: MenuGroup[] = menu.data.categories
    .map((c) => ({ id: c.id, name: c.name, products: menu.data.products.filter((p) => p.category_id === c.id) }))
    .filter((g) => g.products.length > 0);

  return <FullMenu groups={groups} ordersEnabled={settings.orders_enabled} notice={settings.order_notice} />;
}
