import { format } from "date-fns";
import { Megaphone, Pencil, Plus, Power, Trash2 } from "lucide-react";
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
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAllAnnouncements,
  subscribeToAnnouncements,
  updateAnnouncement,
} from "@/services/announcementService";
import type { AnnouncementType, DbAnnouncement } from "@/types/database";

const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "promo", label: "Promo" },
  { value: "warning", label: "Warning" },
  { value: "closure", label: "Closure" },
];

/** to datetime-local input value */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd'T'HH:mm");
}

interface FormState {
  title: string;
  message: string;
  type: AnnouncementType;
  startsAt: string;
  endsAt: string;
  buttonText: string;
  buttonUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  message: "",
  type: "info",
  startsAt: toLocalInput(new Date().toISOString()),
  endsAt: "",
  buttonText: "",
  buttonUrl: "",
  isActive: true,
};

/** Announcement manager: list, create, edit, activate/deactivate, delete. */
export default function AnnouncementsPage() {
  const [items, setItems] = React.useState<DbAnnouncement[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DbAnnouncement | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);

  React.useEffect(() => {
    document.title = "Announcements — Dangbu Staff";
  }, []);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setItems(await fetchAllAnnouncements());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load announcements.");
    }
  }, []);

  React.useEffect(() => {
    void load();
    return subscribeToAnnouncements(() => void load());
  }, [load]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: DbAnnouncement) => {
    setEditing(item);
    setForm({
      title: item.title,
      message: item.message,
      type: item.type,
      startsAt: toLocalInput(item.starts_at),
      endsAt: toLocalInput(item.ends_at),
      buttonText: item.button_text ?? "",
      buttonUrl: item.button_url ?? "",
      isActive: item.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setShowErrors(true);
      toast.error("Title and message are required.");
      return;
    }
    setShowErrors(false);
    // Block javascript:/data: links before they ever reach the public page.
    const buttonUrl = form.buttonUrl.trim();
    if (buttonUrl && !/^(https:\/\/|\/(?!\/))/i.test(buttonUrl)) {
      toast.error("Button link must start with https:// or be a site path like /#menu.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
      ends_at: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      button_text: form.buttonText.trim() || null,
      button_url: buttonUrl || null,
      is_active: form.isActive,
    };
    try {
      if (editing) {
        await updateAnnouncement(editing.id, payload);
        toast.success("Announcement updated.");
      } else {
        await createAnnouncement(payload);
        toast.success("Announcement published.");
      }
      setDialogOpen(false);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save the announcement.");
    } finally {
      setSaving(false);
    }
  };

  /** Enter submits the dialog form — native form semantics, keyboard friendly. */
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save();
  };

  const toggleActive = async (item: DbAnnouncement) => {
    setBusyId(item.id);
    try {
      await updateAnnouncement(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? "Announcement deactivated." : "Announcement activated.");
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: DbAnnouncement) => {
    if (!window.confirm(`Delete “${item.title}” permanently?`)) return;
    setBusyId(item.id);
    try {
      await deleteAnnouncement(item.id);
      toast.success("Announcement deleted.");
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display-lg text-bone">Announcements</h1>
          <p className="copy-sm mt-1">
            Active announcements show at the very top of the public website.
          </p>
        </div>
        <Button variant="ember" size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New announcement
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 p-3 font-sans text-[0.82rem] text-ember-light">
          {error}
        </p>
      ) : null}

      {items === null ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 p-10 text-center">
          <Megaphone className="size-8 text-brass" aria-hidden="true" />
          <p className="copy-sm">No announcements yet. Create one to greet your guests.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.id} className="panel flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base uppercase tracking-[0.04em] text-bone">
                      {item.title}
                    </h2>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                    <Badge variant={item.is_active ? "solid" : "outline"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="copy-sm mt-1.5 max-w-2xl">{item.message}</p>
                  <p className="mt-2 font-sans text-[0.66rem] uppercase tracking-[0.14em] text-ash-text">
                    {format(new Date(item.starts_at), "MMM d, yyyy h:mm a")}
                    {" → "}
                    {item.ends_at ? format(new Date(item.ends_at), "MMM d, yyyy h:mm a") : "No end"}
                    {item.button_text && item.button_url
                      ? ` · Button: ${item.button_text}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant={item.is_active ? "outline" : "ember"}
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => void toggleActive(item)}
                  >
                    <Power className="size-3.5" aria-hidden="true" />
                    {item.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => void remove(item)}
                    aria-label={`Delete announcement: ${item.title}`}
                  >
                    <Trash2 className="size-3.5 text-ember-light" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <form className="flex min-h-0 flex-col" onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
              <DialogDescription>
                Shown at the top of the public website while active and within its date window.
              </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[calc(100dvh-15rem)] min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5">
              <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="ann-title">
                    Title{" "}
                    <span className="text-ember" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <span className="font-sans text-[0.66rem] tabular-nums text-ash-text">
                    {form.title.length}/120
                  </span>
                </div>
                <Input
                  id="ann-title"
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="e.g. Holiday Hours"
                  maxLength={120}
                  aria-invalid={showErrors && !form.title.trim()}
                  aria-describedby={showErrors && !form.title.trim() ? "ann-title-error" : undefined}
                />
                {showErrors && !form.title.trim() ? (
                  <p id="ann-title-error" role="alert" className="text-[0.72rem] text-[#ff9d92]">
                    Give the announcement a title.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="ann-message">
                    Message{" "}
                    <span className="text-ember" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <span className="font-sans text-[0.66rem] tabular-nums text-ash-text">
                    {form.message.length}/400
                  </span>
                </div>
                <Textarea
                  id="ann-message"
                  rows={3}
                  value={form.message}
                  onChange={(event) => setField("message", event.target.value)}
                  placeholder="Short message guests will read in the top bar…"
                  maxLength={400}
                  aria-invalid={showErrors && !form.message.trim()}
                  aria-describedby={
                    showErrors && !form.message.trim() ? "ann-message-error" : undefined
                  }
                />
                {showErrors && !form.message.trim() ? (
                  <p id="ann-message-error" role="alert" className="text-[0.72rem] text-[#ff9d92]">
                    Add the message guests will read.
                  </p>
                ) : (
                  <p className="text-[0.72rem] text-ash-text">
                    Keep it short — it renders in a single bar above the navbar.
                  </p>
                )}
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="ann-type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) => setField("type", value as AnnouncementType)}
                  >
                    <SelectTrigger id="ann-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[0.72rem] text-ash-text">
                    Sets the bar colour and icon on the public site.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ann-starts">Start date</Label>
                  <Input
                    id="ann-starts"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) => setField("startsAt", event.target.value)}
                    className="[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&:hover::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ann-ends">End date (optional)</Label>
                  <Input
                    id="ann-ends"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) => setField("endsAt", event.target.value)}
                    className="[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&:hover::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="ann-btn-text">Button text (optional)</Label>
                  <Input
                    id="ann-btn-text"
                    value={form.buttonText}
                    onChange={(event) => setField("buttonText", event.target.value)}
                    placeholder="e.g. Learn more"
                    maxLength={40}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ann-btn-url">Button URL (optional)</Label>
                  <Input
                    id="ann-btn-url"
                    type="url"
                    value={form.buttonUrl}
                    onChange={(event) => setField("buttonUrl", event.target.value)}
                    placeholder="https://… or /#menu"
                    maxLength={200}
                  />
                </div>
                <p className="text-[0.72rem] leading-relaxed text-ash-text sm:col-span-2">
                  Fill in both fields to show a button. Links must start with
                  <span className="font-semibold text-bone">{" https:// "}</span>
                  or be a site path like
                  <span className="font-semibold text-bone">{" /#menu"}</span>.
                </p>
              </div>

              <label
                htmlFor="ann-active"
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-bone/10 bg-ink/60 px-4 py-3 transition-colors hover:border-bone/20"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-sans text-[0.8rem] font-semibold text-bone">Active</span>
                  <span className="text-[0.72rem] leading-snug text-ash-text">
                    Shows on the website during its date window.
                  </span>
                </span>
                <span className="relative inline-flex shrink-0">
                  <input
                    id="ann-active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setField("isActive", event.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="h-6 w-11 rounded-full border border-bone/15 bg-ink-soft transition-colors peer-checked:border-brass/60 peer-checked:bg-brass/85 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brass"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-bone/70 shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-ink"
                  />
                </span>
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="ember" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
