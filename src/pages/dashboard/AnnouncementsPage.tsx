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
      toast.error("Title and message are required.");
      return;
    }
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
            <DialogDescription>
              Shown at the top of the public website while active and within its date window.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60dvh] gap-3.5 overflow-y-auto px-5 pb-2 sm:px-7">
            <div className="grid gap-1.5">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="e.g. Holiday Hours"
                maxLength={120}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ann-message">Message</Label>
              <Textarea
                id="ann-message"
                rows={3}
                value={form.message}
                onChange={(event) => setField("message", event.target.value)}
                placeholder="Short message guests will read in the top bar…"
                maxLength={400}
              />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div className="grid gap-1.5">
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
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ann-starts">Start date</Label>
                <Input
                  id="ann-starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setField("startsAt", event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ann-ends">End date (optional)</Label>
                <Input
                  id="ann-ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setField("endsAt", event.target.value)}
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
            </div>
            <label
              htmlFor="ann-active"
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-bone/10 bg-ink/60 px-3.5 py-2.5"
            >
              <input
                id="ann-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setField("isActive", event.target.checked)}
                className="size-4 accent-[#e7b24c]"
              />
              <span className="font-sans text-[0.8rem] text-bone-dim">
                Active (visible on the website during its date window)
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="ember" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
