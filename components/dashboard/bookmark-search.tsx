"use client";

import { memo, useState, useRef, useCallback, useEffect } from "react";
import Plus from "lucide-react/dist/esm/icons/plus";
import Command from "lucide-react/dist/esm/icons/command";

interface BookmarkSearchProps {
  /** Called with the debounced search query for filtering */
  onSearch: (query: string) => void;
  /** Called when the user presses Enter to submit/create a bookmark */
  onSubmit: (value: string) => void;
}

const DEBOUNCE_MS = 300;

export const BookmarkSearch = memo(function BookmarkSearch({
  onSearch,
  onSubmit,
}: BookmarkSearchProps) {
  const [localValue, setLocalValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);

      // Debounce the filter callback
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(val);
      }, DEBOUNCE_MS);
    },
    [onSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && localValue.trim()) {
        // Cancel any pending debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onSubmit(localValue.trim());
        setLocalValue("");
        onSearch("");
      }
    },
    [localValue, onSubmit, onSearch],
  );

  return (
    <div className="relative flex items-center w-full">
      <Plus className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <input
        id="bookmark-input"
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Insert a link, color, or just plain text..."
        className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-20 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <div className="absolute right-2 flex items-center gap-1.5">
        <kbd className="inline-flex items-center justify-center size-6 rounded border border-border bg-muted text-muted-foreground text-xs">
          <Command className="size-3" />
        </kbd>
        <kbd className="inline-flex items-center justify-center size-6 rounded border border-border bg-muted text-muted-foreground text-xs font-medium">
          F
        </kbd>
      </div>
    </div>
  );
});
