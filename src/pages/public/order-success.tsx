import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function OrderSuccessPage() {
  usePageTitle("Order received");
  const n = useSearchParams()[0].get("n");
  const valid = n && /^SC-\d{6}-\d{4,}$/.test(n);
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
      <h1 className="mt-4 text-3xl font-extrabold text-navy">Order received!</h1>
      {valid && <p className="mt-3 text-lg">Your order number is <strong className="rounded bg-butter px-2 py-0.5">{n}</strong></p>}
      <p className="mt-4 text-muted">The cafe has your request and will confirm it shortly. This is not yet a paid order — payment is cash at the counter, on pickup, or on delivery. Keep your order number handy.</p>
      <div className="mt-8 flex justify-center gap-3"><Link to="/" className="btn btn-solid">Back home</Link><Link to="/gallery" className="btn btn-line">See our gallery</Link></div>
    </div>
  );
}
