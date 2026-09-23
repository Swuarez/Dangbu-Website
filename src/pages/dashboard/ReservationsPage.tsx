import { format } from "date-fns";
import {
  Ban,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  RefreshCw,
  Search,
  UserX,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { branches, getBranchName } from "@/data/branches";
import { getPackageLabel } from "@/data/menu";
import {
  formatSlotLabel,
  type Reservation,
  type ReservationStatus,
} from "@/services/reservationService";
import {
  fetchReservations,
  subscribeToReservations,
  updateReservationNotes,
  updateReservationStatus,
  type ReservationPage,
} from "@/services/staffService";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

const STATUS_BADGE: Record<ReservationStatus, string> = {
  pending: "border-brass/50 text-brass-light",
  confirmed: "border-emerald-400/50 text-emerald-300",
  completed: "border-sky-400/50 text-sky-300",
  cancelled: "border-bone/25 text-ash-text",
  no_show: "border-ember/60 text-ember-light",
};

function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STATUS_BADGE[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

/** Which follow-up statuses a staff member may set from a given state. */
const NEXT_ACTIONS: Record<
  ReservationStatus,
  { status: ReservationStatus; label: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  pending: [
    { status: "confirmed", label: "Confirm", icon: Check },
    { status: "cancelled", label: "Cancel", icon: Ban },
  ],
  confirmed: [
    { status: "completed", label: "Complete", icon: CheckCheck },
    { status: "no_show", label: "No-show", icon: UserX },
    { status: "cancelled", label: "Cancel", icon: Ban },
  ],
  completed: [],
  cancelled: [{ status: "pending", label: "Reopen", icon: RefreshCw }],
  no_show: [{ status: "pending", label: "Reopen", icon: RefreshCw }],
};

/** Reservation list with search, filters, pagination, status + notes. */
export default function ReservationsPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ReservationStatus | "all">("all");
  const [branchId, setBranchId] = React.useState<string | "all">("all");
  const [date, setDate] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [result, setResult] = React.useState<ReservationPage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [notesTarget, setNotesTarget] = React.useState<Reservation | null>(null);
  const [notesDraft, setNotesDraft] = React.useState("");

  React.useEffect(() => {
    document.title = "Reservations — Dangbu Staff";
  }, []);

  // Debounce free-text search so we do not query on every keystroke.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setResult(
        await fetchReservations({
          status,
          branchId,
          date: date || undefined,
          search: search || undefined,
          page,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load reservations.");
    } finally {
      setLoading(false);
    }
  }, [status, branchId, date, search, page]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // One realtime channel — refetch the current page on any change.
  React.useEffect(
    () =>
      subscribeToReservations(() => {
        toast.info("Reservations updated", { description: "The list has been refreshed." });
        void load();
      }),
    [load],
  );

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  const changeStatus = async (reservation: Reservation, next: ReservationStatus) => {
    setBusyId(reservation.id);
    try {
      await updateReservationStatus(reservation.id, next);
      toast.success(`${reservation.reference} marked as ${next.replace("_", " ")}.`);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const openNotes = (reservation: Reservation) => {
    setNotesTarget(reservation);
    setNotesDraft(reservation.internalNotes ?? "");
  };

  const saveNotes = async () => {
    if (!notesTarget) return;
    setBusyId(notesTarget.id);
    try {
      await updateReservationNotes(notesTarget.id, notesDraft);
      toast.success("Internal note saved.");
      setNotesTarget(null);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save the note.");
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (reservation: Reservation) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {NEXT_ACTIONS[reservation.status].map((action) => (
        <Button
          key={action.status}
          variant={action.status === "confirmed" || action.status === "completed" ? "ember" : "outline"}
          size="sm"
          disabled={busyId === reservation.id}
          onClick={() => void changeStatus(reservation, action.status)}
        >
          <action.icon className="size-3.5" aria-hidden="true" />
          {action.label}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        disabled={busyId === reservation.id}
        onClick={() => openNotes(reservation)}
        aria-label={`Edit internal note for ${reservation.reference}`}
      >
        <NotebookPen className="size-3.5" aria-hidden="true" />
        Notes{reservation.internalNotes ? " •" : ""}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display-lg text-bone">Reservations</h1>
          <p className="copy-sm mt-1">
            {result ? `${result.total} booking${result.total === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="panel grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="grid gap-1.5">
          <Label htmlFor="res-search">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ash-text"
              aria-hidden="true"
            />
            <Input
              id="res-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Reference, name or mobile…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="res-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as ReservationStatus | "all");
              setPage(0);
            }}
          >
            <SelectTrigger id="res-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="res-branch">Branch</Label>
          <Select
            value={branchId}
            onValueChange={(value) => {
              setBranchId(value);
              setPage(0);
            }}
          >
            <SelectTrigger id="res-branch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="res-date">Date</Label>
          <Input
            id="res-date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 p-3 font-sans text-[0.82rem] text-ember-light">
          {error}
        </p>
      ) : null}

      {/* Results — table on desktop, stacked cards on mobile */}
      {loading && !result ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : result && result.rows.length === 0 ? (
        <p className="panel copy-sm p-8 text-center">No reservations match these filters.</p>
      ) : result ? (
        <>
          <div className="panel hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <caption className="sr-only">Reservations</caption>
              <thead>
                <tr className="border-b border-bone/10 font-sans text-[0.62rem] uppercase tracking-[0.18em] text-ash-text">
                  <th scope="col" className="px-4 py-3 font-semibold">Guest</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Schedule</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Branch / Package</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-bone/6 align-top last:border-0">
                    <td className="px-4 py-3.5">
                      <p className="font-sans text-[0.86rem] font-semibold text-bone">
                        {reservation.fullName}
                      </p>
                      <p className="font-sans text-[0.7rem] text-ash-text">
                        {reservation.mobile}
                        {reservation.email ? ` · ${reservation.email}` : ""}
                      </p>
                      <p className="font-sans text-[0.66rem] uppercase tracking-[0.14em] text-brass/80">
                        {reservation.reference}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 font-sans text-[0.82rem] text-bone-dim">
                      {format(new Date(`${reservation.date}T00:00:00`), "MMM d, yyyy")}
                      <span className="mx-1.5 text-bone/30">·</span>
                      {formatSlotLabel(reservation.time)}
                      <span className="ml-1.5 text-ash-text">({reservation.guests} pax)</span>
                    </td>
                    <td className="px-4 py-3.5 font-sans text-[0.78rem] text-bone-dim">
                      {getBranchName(reservation.branchId)}
                      <br />
                      <span className="text-ash-text">{getPackageLabel(reservation.packageId)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-4 py-3.5">{renderActions(reservation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 lg:hidden">
            {result.rows.map((reservation) => (
              <li key={reservation.id} className="panel flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[0.9rem] font-semibold text-bone">
                      {reservation.fullName}
                    </p>
                    <p className="font-sans text-[0.7rem] text-ash-text">{reservation.mobile}</p>
                    <p className="font-sans text-[0.66rem] uppercase tracking-[0.14em] text-brass/80">
                      {reservation.reference}
                    </p>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
                <p className="font-sans text-[0.8rem] text-bone-dim">
                  {format(new Date(`${reservation.date}T00:00:00`), "MMM d, yyyy")} ·{" "}
                  {formatSlotLabel(reservation.time)} · {reservation.guests} pax
                  <br />
                  <span className="text-ash-text">
                    {getBranchName(reservation.branchId)} · {getPackageLabel(reservation.packageId)}
                  </span>
                </p>
                {reservation.specialRequest ? (
                  <p className="rounded-lg border border-bone/10 bg-ink/60 p-2.5 font-sans text-[0.76rem] italic text-bone-dim">
                    “{reservation.specialRequest}”
                  </p>
                ) : null}
                {renderActions(reservation)}
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-ash-text">
              Page {result.page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || page + 1 >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

        </>
      ) : null}

      {/* Internal notes dialog */}
      <Dialog
        open={notesTarget !== null}
        onOpenChange={(next) => {
          if (!next) setNotesTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Internal note</DialogTitle>
            <DialogDescription>
              {notesTarget?.reference} — only visible to staff, never to the guest.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 px-5 pb-2 sm:px-7">
            <Label htmlFor="internal-note">Note</Label>
            <Textarea
              id="internal-note"
              rows={4}
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="e.g. Guest requested a grill table near the window…"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNotesTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="ember"
              onClick={() => void saveNotes()}
              disabled={busyId !== null && busyId === notesTarget?.id}
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
