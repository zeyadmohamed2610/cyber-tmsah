import { Shield } from "lucide-react";

/**
 * Loading Screen Component
 * Displayed while the app is loading or during lazy loading
 */
export const LoadingScreen = () => {
  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      {/* Loading Animation */}
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-20 h-20 rounded-full border-4 border-muted animate-spin" 
          style={{ borderTopColor: "hsl(var(--primary))" }}
        />
        
        {/* Inner Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
      
      {/* Loading Text */}
      <p className="mt-6 text-muted-foreground text-sm animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
};

/**
 * Skeleton Loader for Cards
 */
export const CardSkeleton = () => {
  return (
    <div className="rounded-xl bg-card border border-border p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  );
};

/**
 * Skeleton Loader for Schedule Items
 */
export const ScheduleSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-card border border-border p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Loader for Hero Section
 */
export const HeroSkeleton = () => {
  return (
    <div className="relative overflow-hidden py-28 md:py-40 animate-pulse">
      <div className="section-container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-4 bg-muted rounded w-48 mx-auto mb-8" />
          <div className="h-16 bg-muted rounded w-3/4 mx-auto mb-4" />
          <div className="h-12 bg-muted rounded w-1/2 mx-auto mb-8" />
          <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-10" />
          <div className="flex justify-center gap-4">
            <div className="h-12 bg-muted rounded w-40" />
            <div className="h-12 bg-muted rounded w-40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
