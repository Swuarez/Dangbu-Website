import { format } from "date-fns";
import { Braces, CheckCircle2, Database, MapPin, XCircle } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { branches } from "@/data/branches";
import { menuPackages } from "@/data/menu";
import { reservationConfig } from "@/data/reservationConfig";
import { site } from "@/data/site";
import { isSupabaseConfigured, supabaseProjectHost } from "@/lib/supabaseClient";

/** Read-only overview of configuration, branches and connection status. */
export default function SettingsPage() {
  React.useEffect(() => {
    document.title = "Settings — Dangbu Staff";
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display-lg text-bone">Settings</h1>
        <p className="copy-sm mt-1">
          Restaurant configuration lives in code (src/data) so the site stays fully static and
          free to host.
        </p>
      </div>

      <section aria-labelledby="settings-connection" className="panel p-4 sm:p-5">
        <h2 id="settings-connection" className="display-sm mb-3 flex items-center gap-2 text-bone">
          <Database className="size-4 text-brass" aria-hidden="true" />
          Supabase connection
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          {isSupabaseConfigured ? (
            <>
              <Badge variant="solid">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Connected
              </Badge>
              <span className="font-sans text-[0.78rem] text-bone-dim">{supabaseProjectHost}</span>
            </>
          ) : (
            <>
              <Badge variant="outline">
                <XCircle className="size-3" aria-hidden="true" />
                Not configured
              </Badge>
              <span className="font-sans text-[0.78rem] text-bone-dim">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — see DEPLOYMENT.md.
              </span>
            </>
          )}
        </div>
        <p className="copy-sm mt-3">
          Only the public anon key is used in the browser. Row Level Security on every table
          protects guest data; the service-role key is never part of this app.
        </p>
      </section>

      <section aria-labelledby="settings-booking" className="panel p-4 sm:p-5">
        <h2 id="settings-booking" className="display-sm mb-3 flex items-center gap-2 text-bone">
          <Braces className="size-4 text-brass" aria-hidden="true" />
          Booking rules
        </h2>
        <dl className="grid gap-2 font-sans text-[0.82rem] text-bone-dim sm:grid-cols-2">
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-ash-text">Hours</dt>
            <dd>
              {reservationConfig.openingTime} – {reservationConfig.closingTime} ·{" "}
              {reservationConfig.slotIntervalMinutes}-min slots
            </dd>
          </div>
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-ash-text">Party size</dt>
            <dd>
              {reservationConfig.minGuestsPerReservation}–{reservationConfig.maxGuestsPerReservation}{" "}
              guests · max {reservationConfig.maxGuestsPerSlot} per slot
            </dd>
          </div>
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-ash-text">Window</dt>
            <dd>{reservationConfig.advanceBookingDays} days ahead</dd>
          </div>
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-ash-text">Packages</dt>
            <dd>{menuPackages.map((pkg) => pkg.price).join(" · ")}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="settings-branches" className="panel p-4 sm:p-5">
        <h2 id="settings-branches" className="display-sm mb-3 flex items-center gap-2 text-bone">
          <MapPin className="size-4 text-brass" aria-hidden="true" />
          Branches
        </h2>
        <ul className="grid gap-2.5">
          {branches.map((branch) => (
            <li
              key={branch.id}
              className="rounded-xl border border-bone/10 bg-ink/60 px-4 py-3 font-sans text-[0.82rem] text-bone-dim"
            >
              <p className="font-semibold text-bone">{branch.name}</p>
              <p>{branch.address}</p>
              <p className="text-ash-text">
                {branch.hours} · {branch.seating}
              </p>
            </li>
          ))}
        </ul>
        <p className="copy-sm mt-3">
          {site.fullName} · {format(new Date(), "yyyy")}
        </p>
      </section>
    </div>
  );
}
