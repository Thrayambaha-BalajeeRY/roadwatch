import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { motion, useScroll, useSpring } from "framer-motion";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/Navbar";
import { CursorGlow } from "@/components/CursorGlow";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-deep px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-extrabold text-gradient-cyan">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-text">Page not found</h2>
        <p className="mt-2 text-sm text-text-dim">This route doesn&apos;t exist in the RoadWatch system.</p>
        <div className="mt-6">
          <Link to="/" className="btn-primary inline-block">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-deep px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-text">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-text-dim">Something went wrong. Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-ghost">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RoadWatch — AI Road Intelligence" },
      {
        name: "description",
        content:
          "Real-time AI detection of potholes, budget mismanagement, and infrastructure failures — pinpointed to exact GPS coordinates. Built for the citizens of India.",
      },
      { name: "author", content: "RoadWatch" },
      { property: "og:title", content: "RoadWatch — AI Road Intelligence" },
      { property: "og:description", content: "GPS-accurate AI monitoring for India's roads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: "0%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: "linear-gradient(90deg, #00d4ff, #00ff88)",
        zIndex: 1001,
      }}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-deep text-text">
        <CursorGlow />
        <ScrollProgress />
        <Navbar />
        <main key={pathname} className="pt-16">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
