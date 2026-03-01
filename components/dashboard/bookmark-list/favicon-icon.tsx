import { useState, memo } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import type { Bookmark } from "./types";

interface FaviconIconProps {
  bookmark: Bookmark;
}

export const FaviconIcon = memo(function FaviconIcon({ bookmark }: FaviconIconProps) {
  const [imgError, setImgError] = useState(false);

  if (bookmark.favicon && !imgError) {
    return (
      <div className="relative size-7 rounded-lg overflow-hidden shrink-0 border border-border bg-background">
        <img
          src={bookmark.favicon}
          alt=""
          width={28}
          height={28}
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
        {bookmark.doneReading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Check className="size-4 text-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative size-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: bookmark.fallbackColor }}
    >
      {bookmark.title.charAt(0).toUpperCase()}
      {bookmark.doneReading && (
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
          <Check className="size-4 text-white" />
        </div>
      )}
    </div>
  );
});
