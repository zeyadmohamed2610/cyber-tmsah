import { useEffect } from "react";

/**
 * Performance monitoring hook
 * Tracks Core Web Vitals and reports to analytics
 */
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Track Core Web Vitals
    const trackWebVitals = () => {
      // CLS (Cumulative Layout Shift)
      if ("PerformanceObserver" in window) {
        try {
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            let clsValue = 0;

            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });

            // Report to analytics
            if (typeof window !== "undefined" && (window as any).gtag) {
              (window as any).gtag("event", "web_vitals", {
                event_category: "CLS",
                value: Math.round(clsValue * 1000) / 1000,
                event_label: "layout_shift",
                non_interaction: true,
              });
            }
          });

          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
          console.log("CLS tracking not supported");
        }
      }

      // LCP (Largest Contentful Paint)
      if ("PerformanceObserver" in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry;

            if (typeof window !== "undefined" && (window as any).gtag) {
              (window as any).gtag("event", "web_vitals", {
                event_category: "LCP",
                value: Math.round(lastEntry.startTime),
                event_label: "largest_contentful_paint",
                non_interaction: true,
              });
            }
          });

          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (e) {
          console.log("LCP tracking not supported");
        }
      }

      // FID (First Input Delay)
      if ("PerformanceObserver" in window) {
        try {
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (typeof window !== "undefined" && (window as any).gtag) {
                (window as any).gtag("event", "web_vitals", {
                  event_category: "FID",
                  value: Math.round(entry.processingStart - entry.startTime),
                  event_label: "first_input_delay",
                  non_interaction: true,
                });
              }
            });
          });

          fidObserver.observe({ entryTypes: ["first-input"] });
        } catch (e) {
          console.log("FID tracking not supported");
        }
      }
    };

    // Track page load time
    const trackPageLoad = () => {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType(
            "navigation"
          )[0] as PerformanceNavigationTiming;

          if (perfData) {
            const loadTime = perfData.loadEventEnd - perfData.startTime;

            if (typeof window !== "undefined" && (window as any).gtag) {
              (window as any).gtag("event", "page_load_time", {
                event_category: "Performance",
                value: Math.round(loadTime),
                event_label: "page_load",
                non_interaction: true,
              });
            }
          }
        }, 0);
      });
    };

    trackWebVitals();
    trackPageLoad();
  }, []);
};

/**
 * Measure component render time
 */
export const useComponentPerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // Log slow components (> 16ms = 1 frame)
        console.warn(
          `Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);
};

/**
 * Preload critical resources
 */
export const preloadCriticalResources = () => {
  const criticalResources = [
    // Add critical fonts, images, or scripts here
  ];

  criticalResources.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = href.match(/\.(woff2?|ttf)$/) ? "font" : "fetch";
    if (link.as === "font") {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  });
};

export default usePerformanceMonitoring;
