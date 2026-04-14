import { useState, memo } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import type { Bookmark } from "./types";

interface FaviconIconProps {
  bookmark: Bookmark;
}

export const FaviconIcon = memo(function FaviconIcon({
  bookmark,
}: FaviconIconProps) {
  const [imgError, setImgError] = useState(false);

  if (bookmark.favicon && !imgError) {
    return (
      <div className="relative size-7 rounded-lg overflow-hidden shrink-0 border border-border bg-background">
        <Image
          src={bookmark.favicon}
          alt=""
          width={28}
          height={28}
          sizes="28px"
          className="size-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
          unoptimized
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
