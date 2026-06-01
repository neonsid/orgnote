import { useEffect, useRef } from "react";

/**
 * Runs `fn` exactly once on mount.
 * If `fn` returns a cleanup function, it will run on unmount.
 */
export function useMountEffect(fn: () => void | (() => void)) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    return fnRef.current();
  }, []);
}
