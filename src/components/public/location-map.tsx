import { useState } from "react";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { mapEmbedUrl } from "@/lib/maps";
import { cn } from "@/lib/utils";

export interface MapPlace { id: string; name: string; query: string; directionsHref: string }

/** Embedded Google map with a tab per place and a big Directions button that opens the Maps app on phones. */
export function LocationMap({ places, className }: { places: MapPlace[]; className?: string }) {
  const [i, setI] = useState(0);
  if (places.length === 0) return null;
  const p = places[Math.min(i, places.length - 1)];
  return (
    <div className={cn("card flex flex-col overflow-hidden p-0", className)}>
      {places.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-line bg-paper p-3" role="group" aria-label="Choose a location">
          {places.map((x, idx) => (
            <button key={x.id} type="button" aria-pressed={idx === i} onClick={() => setI(idx)}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition", idx === i ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy")}>
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {x.name}
            </button>
          ))}
        </div>
      )}
      <div className="relative h-72 w-full bg-butter/30 sm:h-96 lg:h-[30rem]">
        <iframe key={p.id} title={`Map showing ${p.name}`} src={mapEmbedUrl(p.query)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" allowFullScreen />
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><p className="font-bold">{p.name}</p><p className="truncate text-sm text-muted">{p.query}</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <a href={p.directionsHref} target="_blank" rel="noopener noreferrer" className="btn btn-orange"><Navigation className="h-4 w-4" aria-hidden /> Get directions</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy underline">Map not loading? Open in Maps <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
        </div>
      </div>
    </div>
  );
}
