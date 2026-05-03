import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, Sparkles, ListChecks, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Data", icon: Upload },
  { to: "/matching", label: "Matching", icon: Sparkles },
  { to: "/review", label: "Review Queue", icon: ListChecks },
] as const;

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="glass-card mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-neon shadow-glow-orange">
            <Fingerprint className="h-5 w-5 text-background" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-wider text-glow-orange">UBID</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Identity Resolution</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {items.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-primary/15 text-primary text-glow-orange"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          AI Engine: Online
        </div>
      </div>

      <nav className="md:hidden glass-card mx-auto mt-3 flex max-w-7xl items-center justify-around p-2">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
