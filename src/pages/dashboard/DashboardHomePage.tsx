import { format } from "date-fns";
import { ArrowRight, CalendarCheck, Clock, Users } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getBranchName } from "@/data/branches";
import { getPackageLabel } from "@/data/menu";
import {
  fetchDashboardStats,
  fetchReservations,
  subscribeToReservations,
  type DashboardStats,
} from "@/services/staffService";
import { formatSlotLabel, toDateKey, type Reservation } from "@/services/reservationService";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="panel flex items-center gap-4 p-4 sm:p-5">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-brass/35 bg-ink">
        <Icon className="size-5 text-brass" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl leading-none text-bone">{value}</p>
        <p className="mt-1 truncate font-sans text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ash-text">
          {label}
        </p>
      </div>
    </div>
  );
}

/** Dashboard home: today's numbers + the next bookings, realtime-refreshed. */
export default function DashboardHomePage() {
  const todayKey = toDateKey(new Date());
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [today, setToday] = React.useState<Reservation[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.title = "Dashboard — Dangbu Staff";
  }, []);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const [nextStats, page] = await Promise.all([
        fetchDashboardStats(todayKey),
        fetchReservations({ date: todayKey, page: 0, pageSize: 8 }),
      ]);
      setStats(nextStats);
      setToday(page.rows);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the dashboard.");
    }
  }, [todayKey]);

  React.useEffect(() => {
    void load();
    // One realtime channel: any reservation change refreshes the numbers.
    return subscribeToReservations(() => void load());
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-lg text-bone">
          Today, <span className="foil-text">{format(new Date(), "MMMM d")}</span>
        </h1>
        <p className="copy-sm mt-1">Live view of today&apos;s tables and what&apos;s coming.</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 p-3 font-sans text-[0.82rem] text-ember-light">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Bookings today" value={stats.todayTotal} icon={CalendarCheck} />
            <StatCard label="Pending today" value={stats.todayPending} icon={Clock} />
            <StatCard label="Confirmed today" value={stats.todayConfirmed} icon={Users} />
            <StatCard label="Upcoming (later dates)" value={stats.upcoming} icon={ArrowRight} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))
        )}
      </div>

      <section aria-labelledby="today-list-title" className="panel p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="today-list-title" className="display-sm text-bone">
            Today&apos;s reservations
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/reservations">View all</Link>
          </Button>
        </div>

        {today === null ? (
          <div className="grid gap-2.5">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : today.length === 0 ? (
          <p className="copy-sm py-6 text-center">No bookings for today yet.</p>
        ) : (
          <ul className="grid gap-2.5">
            {today.map((reservation) => (
              <li
                key={reservation.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bone/10 bg-ink/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-sans text-[0.88rem] font-semibold text-bone">
                    {reservation.fullName}
                    <span className="ml-2 font-normal text-ash-text">
                      {reservation.guests} pax · {getBranchName(reservation.branchId)}
                    </span>
                  </p>
                  <p className="truncate font-sans text-[0.68rem] uppercase tracking-[0.14em] text-ash-text">
                    {reservation.reference} · {getPackageLabel(reservation.packageId)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[0.8rem] font-semibold text-brass">
                    {formatSlotLabel(reservation.time)}
                  </span>
                  <Badge variant={reservation.status === "confirmed" ? "solid" : "outline"}>
                    {reservation.status.replace("_", " ")}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
