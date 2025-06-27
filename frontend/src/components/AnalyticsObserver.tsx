// src/components/AnalyticsObserver.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/firebase";

/**
 * Em cada mudança de rota, dispara um evento page_view
 * para que o GA4 registre views em SPA.
 */
export function AnalyticsObserver() {
  const location = useLocation();

  useEffect(() => {
    logEvent(analytics, "page_view", {
      page_path: location.pathname,
    });
  }, [location]);

  return null;
}
