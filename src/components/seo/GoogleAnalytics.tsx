"use client";

import Script from "next/script";

/** GA4 Measurement ID. Set via environment variable. */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

// ---------------------------------------------------------------------------
// Event tracking helper
// ---------------------------------------------------------------------------

/**
 * Sends a custom event to Google Analytics.
 * Safe to call even when GA is not loaded (e.g. during SSR or with ad blockers).
 *
 * @example
 * trackEvent("route_created", { route_name: "Ruta Maya" });
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;

  const gtag = (window as unknown as Record<string, (...args: unknown[]) => void>)
    .gtag;
  if (typeof gtag === "function") {
    gtag("event", eventName, params);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GoogleAnalyticsProps {
  /** Override the measurement ID (defaults to env variable). */
  measurementId?: string;
}

/**
 * Client component that loads the Google Analytics 4 (gtag.js) script
 * and initialises it with the measurement ID.
 *
 * Place this in the root layout so it loads on every page.
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const id = measurementId ?? GA_MEASUREMENT_ID;

  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_path: window.location.pathname,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}
