import { useEffect, useState } from "react";

const MOBILE_USER_AGENT_PATTERN =
  /(android|iphone|ipod|blackberry|iemobile|opera mini|mobile)/i;
const TABLET_USER_AGENT_PATTERN = /(ipad|tablet|playbook|silk|kindle|android(?!.*mobile))/i;

const detectDesktopDevice = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent ?? "";
  if (MOBILE_USER_AGENT_PATTERN.test(userAgent) || TABLET_USER_AGENT_PATTERN.test(userAgent)) {
    return false;
  }

  const hasTouch =
    navigator.maxTouchPoints > 0 ||
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);

  if (hasTouch && window.innerWidth < 1024) {
    return false;
  }

  return true;
};

export const useIsDesktopDevice = () => {
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);

  useEffect(() => {
    const apply = () => {
      setIsDesktopDevice(detectDesktopDevice());
    };

    apply();
    window.addEventListener("resize", apply);

    return () => {
      window.removeEventListener("resize", apply);
    };
  }, []);

  return isDesktopDevice;
};
