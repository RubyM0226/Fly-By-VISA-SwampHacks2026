"use client";

import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/journey";
import type { SelectedFlight } from "@/lib/trip";
import { PlaneIcon } from "./Icons";

/** The flight picked on the Flights page, shown on the "Book your flight" step. */
export function SelectedFlightBox({ flight: f }: { flight: SelectedFlight }) {
  const { t, lang } = useT();
  const money = new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const stops = f.stops === 0 ? t("flights.nonstop") : f.stops === 1 ? t("flights.oneStop") : t("flights.manyStops", { n: f.stops });

  return (
    <section aria-labelledby="selected-flight-title" className="col-span-full space-y-1 rounded-xl border-2 border-accent bg-accent-soft p-4 text-lg">
      <h4 id="selected-flight-title" className="flex items-center gap-2 font-bold">
        <PlaneIcon className="h-5 w-5 shrink-0" />
        {t("flights.yourSelected")}
      </h4>
      <p>
        {formatDate(f.date, lang)} · {f.airlines.join(", ")} · {money.format(f.price)}
      </p>
      <p>
        {t("flights.duration", { h: Math.floor(f.minutes / 60), m: f.minutes % 60 })} · {stops}
      </p>
      <ul className="text-base">
        {f.legs.map((leg) => (
          <li key={leg.flightNumber}>
            {leg.flightNumber} · {leg.from} {leg.departs.slice(11)} → {leg.to} {leg.arrives.slice(11)}
          </li>
        ))}
      </ul>
    </section>
  );
}
