import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Google Analytics 4 Tracking Component
 * Automatically tracks page views on route changes
 */
export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "GA_MEASUREMENT_ID", {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
};

/**
 * Track custom events
 */
export const trackEvent = (
  action: string,
  category?: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track button clicks
 */
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent("click", "button", buttonName);
  console.log(`Button clicked: ${buttonName} ${location ? `at ${location}` : ""}`);
};

/**
 * Track schedule downloads
 */
export const trackScheduleDownload = (format: "png" | "pdf", section: string) => {
  trackEvent("download", "schedule", `${format}_${section}`);
};

/**
 * Track subject views
 */
export const trackSubjectView = (subjectId: string, subjectTitle: string) => {
  trackEvent("view_item", "subject", subjectTitle);
};

export default Analytics;
