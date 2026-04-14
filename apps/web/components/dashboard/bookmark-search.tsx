"use client";

import { memo, useState, useRef } from "react";
import { Plus, Command } from "lucide-react";
import { forwardRef } from "react";

interface BookmarkSearchProps {
  onSearch: (query: string) => void;
  onSubmit: (value: string) => void;
}

const DEBOUNCE_MS = 300;

export const BookmarkSearch = forwardRef<HTMLInputElement, BookmarkSearchProps>(
  function BookmarkSearch({ onSearch, onSubmit }, ref) {
    const [localValue, setLocalValue] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value;
      setLocalValue(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(val);
      }, DEBOUNCE_MS);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter" && localValue.trim()) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onSubmit(localValue.trim());
        setLocalValue("");
        onSearch("");
      }
    }

    return (
      <div className="relative flex items-center w-full">
        <Plus className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
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
  },
);
