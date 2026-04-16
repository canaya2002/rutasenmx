"use client";

import { useEffect, useRef } from "react";

/** AdSense publisher ID. Set via environment variable. */
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

interface AdSenseProps {
  /** AdSense ad slot ID. */
  slot: string;
  /** Ad format. */
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  /** Whether the ad should be responsive. */
  responsive?: boolean;
  /** Additional CSS class names for the container. */
  className?: string;
  /**
   * When true, the ad unit is not rendered.
   * Use this to suppress ads for pro/premium users.
   */
  suppressAd?: boolean;
}

/**
 * Client component for rendering Google AdSense ad units.
 * Loads the AdSense script once and initialises each ad slot.
 * Respects the `suppressAd` prop to hide ads for paid plans.
 */
export function AdSense({
  slot,
  format = "auto",
  responsive = true,
  className,
  suppressAd = false,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (suppressAd || !ADSENSE_CLIENT_ID) return;

    // Load the AdSense script once globally
    if (
      !scriptLoaded.current &&
      !document.querySelector('script[src*="adsbygoogle.js"]')
    ) {
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
      scriptLoaded.current = true;
    }

    // Push the ad slot
    try {
      const adsbygoogle = (window as unknown as Record<string, unknown[]>)
        .adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
      }
    } catch {
      // AdSense not available (e.g. ad blocker)
    }
  }, [suppressAd]);

  if (suppressAd || !ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
