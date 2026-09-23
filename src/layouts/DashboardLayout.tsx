import {
  CalendarDays,
  Flame,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import * as React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface DashNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
  end?: boolean;
}

const NAV_ITEMS: DashNavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/reservations", label: "Reservations", icon: CalendarDays },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/staff", label: "Staff", icon: Users, ownerOnly: true },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { isOwner } = useAuth();
  return (
    <nav aria-label="Dashboard sections" className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 font-sans text-[0.82rem] font-medium tracking-[0.02em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
              isActive
                ? "border border-brass/40 bg-brass/10 text-brass-light"
                : "border border-transparent text-bone-dim hover:border-bone/10 hover:bg-bone/5 hover:text-bone",
            )
          }
        >
          <item.icon className="size-4 shrink-0" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Staff dashboard shell: permanent sidebar on desktop, a Sheet
 * drawer on mobile. Content renders through <Outlet />.
 */
export default function DashboardLayout() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const identity = (
    <div className="border-t border-bone/10 px-3.5 py-3">
      <p className="truncate font-sans text-[0.78rem] font-semibold text-bone">
        {profile?.full_name || user?.email || "Staff"}
      </p>
      <p className="font-sans text-[0.62rem] uppercase tracking-[0.2em] text-brass">
        {profile?.role === "owner" ? "Owner" : "Staff"}
      </p>
    </div>
  );

  const signOutButton = (
    <Button variant="outline" size="sm" className="w-full" onClick={() => void handleSignOut()}>
      <LogOut className="size-4" aria-hidden="true" />
      Logout
    </Button>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-bone/10 bg-[linear-gradient(180deg,rgba(24,18,15,0.99),rgba(11,8,6,1))] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-bone/10 px-4 py-4">
          <span className="inline-flex size-9 items-center justify-center rounded-full border border-brass/40 bg-ink">
            <Flame className="size-4 text-brass" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.08em] text-bone">Dangbu</p>
            <p className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-ash-text">
              Staff dashboard
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavItems />
        </div>
        {identity}
        <div className="px-3.5 pb-4">{signOutButton}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with drawer */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-bone/10 bg-ink/95 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Open dashboard menu">
                <Menu className="size-4" aria-hidden="true" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(19rem,86vw)] flex-col p-0">
              <SheetTitle className="flex items-center gap-2.5 border-b border-bone/10 px-4 py-4 font-display text-sm uppercase tracking-[0.08em] text-bone">
                <Flame className="size-4 text-brass" aria-hidden="true" />
                Dangbu dashboard
              </SheetTitle>
              <SheetDescription className="sr-only">
                Dashboard navigation and account actions
              </SheetDescription>
              <div className="flex-1 overflow-y-auto p-3">
                <NavItems onNavigate={() => setDrawerOpen(false)} />
              </div>
              {identity}
              <div className="px-3.5 pb-4">{signOutButton}</div>
            </SheetContent>
          </Sheet>
          <p className="font-display text-sm uppercase tracking-[0.08em] text-bone">Dangbu</p>
          <span className="w-[5.5rem]" aria-hidden="true" />
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
