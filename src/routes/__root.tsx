import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-brand-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-brand-dark">404</h1>
        <h2 className="mt-3 text-xl font-semibold text-brand-dark">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-brand-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-btn bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-mid transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "ReportRx — Your lab report, finally explained" },
        {
          name: "description",
          content:
            "Upload your blood test or medical report and get instant plain-English explanations, visual biomarker breakdowns, and the right questions to ask your doctor.",
        },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorBoundary,
  },
);

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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <main>
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>
      <Footer />
    </QueryClientProvider>
  );
}
