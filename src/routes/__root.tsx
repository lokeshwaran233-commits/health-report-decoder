import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

function NotFoundComponent() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-brand-surface px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-brand-dark">404</h1>
        <h2 className="mt-3 text-xl font-semibold text-brand-dark">Page not found</h2>
        <p className="mt-2 text-sm text-brand-muted">The page you're looking for doesn't exist or has been moved.</p>
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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
      { property: "og:title", content: "ReportRx — Your lab report, finally explained" },
      { name: "twitter:title", content: "ReportRx — Your lab report, finally explained" },
      {
        name: "description",
        content:
          "ReportRx decodes medical lab reports, providing plain-English explanations and doctor-ready questions.",
      },
      {
        property: "og:description",
        content:
          "ReportRx decodes medical lab reports, providing plain-English explanations and doctor-ready questions.",
      },
      {
        name: "twitter:description",
        content:
          "ReportRx decodes medical lab reports, providing plain-English explanations and doctor-ready questions.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b02f8986-86ed-4af6-a65d-1754a311922d/id-preview-f04781bb--96269dff-f08b-4155-8e35-794e554c693e.lovable.app-1779676103926.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b02f8986-86ed-4af6-a65d-1754a311922d/id-preview-f04781bb--96269dff-f08b-4155-8e35-794e554c693e.lovable.app-1779676103926.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,600&family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorBoundary,
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  // Sign out after 30 min of inactivity for authenticated users.
  useSessionTimeout({ enabled: !!user });

  // Routes that should render WITHOUT navbar/footer/pagewrapper
  const isBarePage = pathname === "/auth" || pathname === "/auth/reset-password";


  return (
    <QueryClientProvider client={queryClient}>
      {isBarePage ? (
        // Auth page — full screen, no chrome
        <Outlet />
      ) : (
        // Every other page — normal layout
        <>
          <Navbar />
          <main>
            <PageWrapper>
              <Outlet />
            </PageWrapper>
          </main>
          <Footer />
        </>
      )}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
