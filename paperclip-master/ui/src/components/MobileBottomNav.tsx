import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "@/lib/router";
import {
  House,
  CircleDot,
  Inbox,
  MoreHorizontal,
  Users,
  DollarSign,
  Network,
  Settings,
  X,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { cn } from "../lib/utils";
import { useInboxBadge } from "../hooks/useInboxBadge";

interface MobileBottomNavProps {
  visible: boolean;
}

interface MobileNavLinkItem {
  type: "link";
  to: string;
  label: string;
  icon: typeof House;
  badge?: number;
}

export function MobileBottomNav({ visible }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const inboxBadge = useInboxBadge(selectedCompanyId);
  const [moreOpen, setMoreOpen] = useState(false);

  const items = useMemo<MobileNavLinkItem[]>(
    () => [
      { type: "link", to: "/dashboard", label: "Home", icon: House },
      { type: "link", to: "/issues", label: "Issues", icon: CircleDot },
      {
        type: "link",
        to: "/inbox",
        label: "Inbox",
        icon: Inbox,
        badge: inboxBadge.inbox,
      },
    ],
    [inboxBadge.inbox],
  );

  const moreItems = [
    { to: "/agents/all", label: "Agents", icon: Users },
    { to: "/costs", label: "Costs", icon: DollarSign },
    { to: "/org", label: "Org", icon: Network },
    { to: "/company/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-2xl border-t border-border bg-background p-4 pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(item.to);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-colors",
                      isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-transform duration-200 ease-out md:hidden pb-[env(safe-area-inset-bottom)]",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        aria-label="Mobile navigation"
      >
        <div className="grid h-16 grid-cols-4 px-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.3]")} />
                      {item.badge != null && item.badge > 0 && (
                        <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-colors",
              moreOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MoreHorizontal className={cn("h-[18px] w-[18px]", moreOpen && "stroke-[2.3]")} />
            <span className="truncate">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
