import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/Navbar";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <h1 className="text-7xl font-bold text-glow-orange">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UBID — Unified Business Identity Resolution" },
      { name: "description", content: "AI-powered identity resolution dashboard for unifying duplicate business records across government departments." },
      { property: "og:title", content: "UBID — Unified Business Identity Resolution" },
      { name: "twitter:title", content: "UBID — Unified Business Identity Resolution" },
      { property: "og:description", content: "AI-powered identity resolution dashboard for unifying duplicate business records across government departments." },
      { name: "twitter:description", content: "AI-powered identity resolution dashboard for unifying duplicate business records across government departments." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/74ca1913-591b-44da-a2fe-dce3c8142c5f/id-preview-5964ec50--e5e508de-d8b2-4863-8996-c7c31517c920.lovable.app-1777789375074.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/74ca1913-591b-44da-a2fe-dce3c8142c5f/id-preview-5964ec50--e5e508de-d8b2-4863-8996-c7c31517c920.lovable.app-1777789375074.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Outlet />
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
