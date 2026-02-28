import { useEffect, useRef, useCallback } from "react";
import type { Bookmark } from "./types";

interface UseBookmarkShortcutsOptions {
  onRename: (bookmark: Bookmark) => void;
}

export function useBookmarkShortcuts({
  onRename,
}: UseBookmarkShortcutsOptions) {
  const hoveredBookmarkRef = useRef<Bookmark | null>(null);

  const setHoveredBookmark = useCallback((bookmark: Bookmark | null) => {
    hoveredBookmarkRef.current = bookmark;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (hoveredBookmarkRef.current) {
          window.open(
            hoveredBookmarkRef.current.url,
            "_blank",
            "noopener,noreferrer",
          );
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        if (hoveredBookmarkRef.current) {
          onRename(hoveredBookmarkRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRename]);

  return { hoveredBookmarkRef, setHoveredBookmark };
}
