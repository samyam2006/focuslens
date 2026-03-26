import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Tracks tab visibility via the Page Visibility API.
 *
 * Returns:
 *  - isTabVisible: boolean
 *  - tabSwitchCount: number of times user left the tab
 *  - timeAway: total seconds spent away from tab
 *  - resetTabStats(): void
 */
export default function useTabVisibility() {
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timeAway, setTimeAway] = useState(0);
  const leftAtRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const handleChange = () => {
      if (document.hidden) {
        setIsTabVisible(false);
        setTabSwitchCount((c) => c + 1);
        leftAtRef.current = Date.now();

        // Tick time-away counter
        intervalRef.current = setInterval(() => {
          if (leftAtRef.current) {
            setTimeAway((t) => t + 1);
          }
        }, 1000);
      } else {
        setIsTabVisible(true);
        leftAtRef.current = null;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleChange);
    return () => {
      document.removeEventListener("visibilitychange", handleChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const resetTabStats = useCallback(() => {
    setTabSwitchCount(0);
    setTimeAway(0);
    leftAtRef.current = null;
  }, []);

  return { isTabVisible, tabSwitchCount, timeAway, resetTabStats };
}
