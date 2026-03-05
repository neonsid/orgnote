import { useEffect, useRef, useCallback } from "react";
import type { Bookmark } from "./types";

interface UseBookmarkShortcutsOptions {
  onRename: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onShowDescription?: (bookmark: Bookmark) => void;
}

export function useBookmarkShortcuts({
  onRename,
  onDelete,
  onShowDescription,
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
      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault();
        if (hoveredBookmarkRef.current) {
          onDelete(hoveredBookmarkRef.current);
        }
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        if (hoveredBookmarkRef.current && onShowDescription) {
          onShowDescription(hoveredBookmarkRef.current);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRename, onDelete, onShowDescription]);

  return { hoveredBookmarkRef, setHoveredBookmark };
}
