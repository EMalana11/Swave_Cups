import { useQuery } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "@/api/settings";
import { PageHeader } from "@/components/admin/page-header";
import { Async } from "@/components/ui/async";
import { ActionForm, Field, SubmitButton } from "@/components/ui/form";
import { usePageTitle } from "@/hooks/use-page-title";
import { DAY_ORDER } from "@/lib/hours";

export default function SettingsPage() {
  usePageTitle("Cafe Settings", "Admin");
  // A distinct key (not ["settings"]) so the form always edits fresh data, never the public site's cached copy.
  const query = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchSettings, gcTime: 0 });

  return (
    <>
      <PageHeader title="Cafe Settings" subtitle="These details are shown on the public website." />
      <Async query={query}>
        {(s) => {
          const text = (key: keyof typeof s) => (s[key] as string | null) ?? "";
          return (
            <ActionForm action={saveSettings} className="max-w-4xl space-y-6">
              <section className="card grid gap-4 sm:grid-cols-2">
                <h2 className="text-lg font-bold sm:col-span-2">About</h2>
                <Field label="Cafe name *" name="cafe_name"><input id="cafe_name" name="cafe_name" required maxLength={100} className="input" defaultValue={s.cafe_name} /></Field>
                <Field label="Tagline" name="tagline"><input id="tagline" name="tagline" maxLength={200} className="input" defaultValue={text("tagline")} /></Field>
                <Field label="Description (shown in the hero)" name="description" className="sm:col-span-2"><textarea id="description" name="description" rows={3} maxLength={1000} className="input" defaultValue={text("description")} /></Field>
              </section>

              <section className="card grid gap-4 sm:grid-cols-2">
                <h2 className="text-lg font-bold sm:col-span-2">Contact &amp; location</h2>
                <Field label="Phone" name="phone"><input id="phone" name="phone" maxLength={40} className="input" defaultValue={text("phone")} /></Field>
                <Field label="Email" name="email"><input id="email" name="email" type="email" maxLength={120} className="input" defaultValue={text("email")} /></Field>
                <Field label="Address" name="address" className="sm:col-span-2"><input id="address" name="address" maxLength={300} className="input" defaultValue={text("address")} /></Field>
                <Field label="Pop-up location" name="popup_location"><input id="popup_location" name="popup_location" maxLength={200} className="input" defaultValue={text("popup_location")} /></Field>
                <Field label="Map link (https://…)" name="map_url"><input id="map_url" name="map_url" maxLength={300} className="input" defaultValue={text("map_url")} /></Field>
                <Field label="Instagram URL" name="instagram_url"><input id="instagram_url" name="instagram_url" maxLength={300} className="input" defaultValue={text("instagram_url")} /></Field>
                <Field label="Facebook URL" name="facebook_url"><input id="facebook_url" name="facebook_url" maxLength={300} className="input" defaultValue={text("facebook_url")} /></Field>
              </section>

              <section className="card">
                <h2 className="mb-1 text-lg font-bold">Opening hours</h2>
                <p className="mb-3 text-sm text-muted">Leave every day closed or empty to show “follow our socials” instead.</p>
                <div className="space-y-2">
                  {DAY_ORDER.map((day, i) => {
                    const h = s.hours.find((x) => x.day === day);
                    return (
                      <div key={day} className="grid grid-cols-[6rem_1fr_1fr_auto] items-center gap-2 text-sm">
                        <span className="font-medium">{day}</span>
                        <input aria-label={`${day} opens`} name={`open_${i}`} type="time" className="input" defaultValue={h?.open ?? ""} />
                        <input aria-label={`${day} closes`} name={`close_${i}`} type="time" className="input" defaultValue={h?.close ?? ""} />
                        <label className="flex items-center gap-1"><input type="checkbox" name={`closed_${i}`} defaultChecked={h?.closed ?? false} /> Closed</label>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="card grid gap-4 sm:grid-cols-2">
                <h2 className="text-lg font-bold sm:col-span-2">Online ordering</h2>
                <div className="flex flex-wrap gap-5 text-sm sm:col-span-2">
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="orders_enabled" defaultChecked={s.orders_enabled} /> Accept online orders</label>
                  <label className="flex items-center gap-2"><input type="checkbox" name="dine_in_enabled" defaultChecked={s.dine_in_enabled} /> Dine-in</label>
                  <label className="flex items-center gap-2"><input type="checkbox" name="pickup_enabled" defaultChecked={s.pickup_enabled} /> Pickup</label>
                  <label className="flex items-center gap-2"><input type="checkbox" name="delivery_enabled" defaultChecked={s.delivery_enabled} /> Delivery</label>
                </div>
                <Field label="Delivery fee (PHP)" name="delivery_fee"><input id="delivery_fee" name="delivery_fee" type="number" step="0.01" min="0" className="input" defaultValue={s.delivery_fee} /></Field>
                <Field label="Minimum order (PHP)" name="min_order_amount"><input id="min_order_amount" name="min_order_amount" type="number" step="0.01" min="0" className="input" defaultValue={s.min_order_amount} /></Field>
                <Field label="Notice shown at checkout" name="order_notice" className="sm:col-span-2" hint="Payment is cash-only; this text should say so.">
                  <input id="order_notice" name="order_notice" maxLength={400} className="input" defaultValue={text("order_notice")} />
                </Field>
              </section>

              <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
            </ActionForm>
          );
        }}
      </Async>
    </>
  );
}
