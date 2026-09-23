import { format } from "date-fns";
import { Crown, Trash2, UserRound, Users } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { fetchStaff, removeStaff, updateStaffRole } from "@/services/staffService";
import type { DbStaffProfile, StaffRole } from "@/types/database";

/**
 * Staff management (owner only — also enforced by RLS).
 * New logins are created in the Supabase Dashboard (Authentication →
 * Users), then managed here once their staff_profiles row exists.
 */
export default function StaffPage() {
  const { isOwner, user } = useAuth();
  const [items, setItems] = React.useState<DbStaffProfile[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.title = "Staff — Dangbu Dashboard";
  }, []);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setItems(await fetchStaff());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load staff.");
    }
  }, []);

  React.useEffect(() => {
    if (isOwner) void load();
  }, [isOwner, load]);

  if (!isOwner) {
    return (
      <div className="panel flex flex-col items-center gap-3 p-10 text-center">
        <Users className="size-8 text-brass" aria-hidden="true" />
        <h1 className="display-md text-bone">Owner access only</h1>
        <p className="copy-sm max-w-md">
          Staff management is limited to the owner account. Ask the owner if you need a change.
        </p>
      </div>
    );
  }

  const changeRole = async (member: DbStaffProfile, role: StaffRole) => {
    setBusyId(member.id);
    try {
      await updateStaffRole(member.id, role);
      toast.success(`${member.full_name ?? "Member"} is now ${role}.`);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update the role.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member: DbStaffProfile) => {
    if (
      !window.confirm(
        `Remove ${member.full_name ?? "this member"} from staff? They will lose dashboard access.`,
      )
    )
      return;
    setBusyId(member.id);
    try {
      await removeStaff(member.id);
      toast.success("Staff access removed.");
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not remove the member.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display-lg text-bone">Staff</h1>
        <p className="copy-sm mt-1">
          Add logins in Supabase (Authentication → Users → Add user), then assign their role here.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-ember/40 bg-ember/10 p-3 font-sans text-[0.82rem] text-ember-light">
          {error}
        </p>
      ) : null}

      {items === null ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="panel copy-sm p-8 text-center">
          No staff profiles yet. See DEPLOYMENT.md → “Create the owner account”.
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((member) => (
            <li
              key={member.id}
              className="panel flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-brass/35 bg-ink">
                  {member.role === "owner" ? (
                    <Crown className="size-4 text-brass" aria-hidden="true" />
                  ) : (
                    <UserRound className="size-4 text-brass" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-[0.88rem] font-semibold text-bone">
                    {member.full_name ?? "Unnamed member"}
                    {member.id === user?.id ? (
                      <span className="ml-2 font-sans text-[0.62rem] uppercase tracking-[0.16em] text-brass">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="font-sans text-[0.66rem] uppercase tracking-[0.14em] text-ash-text">
                    Since {format(new Date(member.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={member.role === "owner" ? "solid" : "outline"}
                  className="capitalize"
                >
                  {member.role}
                </Badge>
                {member.id !== user?.id ? (
                  <>
                    <Select
                      value={member.role}
                      onValueChange={(value) => void changeRole(member, value as StaffRole)}
                      disabled={busyId === member.id}
                    >
                      <SelectTrigger className="w-28" aria-label="Change role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === member.id}
                      onClick={() => void remove(member)}
                      aria-label={`Remove ${member.full_name ?? "member"} from staff`}
                    >
                      <Trash2 className="size-3.5 text-ember-light" aria-hidden="true" />
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
