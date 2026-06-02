import { createMiddleware } from "@tanstack/react-start";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://*.lovable.dev https://ai.gateway.lovable.dev wss://*.supabase.co",
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Adds baseline security headers to every response.
 * Adds no-store + noindex for share / profile / auth paths.
 */
export const securityHeaders = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const res = result?.response;
  if (!(res instanceof Response)) return result;

  try {
    const url = new URL(res.url || "http://x/");
    const path = url.pathname;
    res.headers.set("Content-Security-Policy", CSP);
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(self), geolocation=(), payment=()",
    );
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );

    if (
      path.startsWith("/s/") ||
      path.startsWith("/auth") ||
      path.startsWith("/history") ||
      path.startsWith("/results") ||
      path.startsWith("/scan")
    ) {
      res.headers.set("Cache-Control", "no-store, private");
      res.headers.set("X-Robots-Tag", "noindex");
    }
  } catch {
    // ignore header set failures (e.g. immutable headers)
  }
  return result;
});
