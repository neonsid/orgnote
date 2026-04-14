import { useEffect } from "react";

/**
 * Runs `fn` exactly once on mount. If `fn` returns a cleanup function, it runs on unmount.
 * Prefer this over raw `useEffect` for mount-only external sync (listeners, observers).
 */
export function useMountEffect(fn: () => void | (() => void)): void {
  useEffect(() => {
    return fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only by design
  }, []);
}
