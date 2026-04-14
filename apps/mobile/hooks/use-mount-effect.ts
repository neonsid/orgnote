import { useEffect } from "react";

/**
 * Runs `fn` exactly once on mount.
 * If `fn` returns a cleanup function, it will run on unmount.
 */
export function useMountEffect(fn: () => void | (() => void)) {
  useEffect(() => {
    return fn?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
