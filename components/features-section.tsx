"use client";

import { cn } from "@/lib/utils";
import {
  Bookmark,
  Sparkles,
  FolderOpen,
  Search,
  Keyboard,
  Fingerprint,
  LayoutList,
} from "lucide-react";

const features = [
  {
    icon: Bookmark,
    className: "fill-black dark:fill-white",
    title: "Save in seconds",
    description: "Paste any URL, hit enter. Done. No friction, no extra steps.",
  },
  {
    icon: Sparkles,
    title: "Auto-fetch metadata",
    description:
      "Titles, descriptions, and favicons are pulled automatically. Your links look great without any effort.",
  },
  {
    icon: FolderOpen,
    title: "Organize with groups",
    description:
      "Create collections to categorize your bookmarks. Keep work, personal, and inspiration separate.",
  },
  {
    icon: Search,
    title: "Instant search",
    description:
      "Find any bookmark by title, URL, or group. Results appear as you type.",
  },
  {
    icon: Keyboard,
    title: "Keyboard shortcuts",
    description:
      "Navigate, search, and manage everything without touching your mouse. Built for speed.",
  },
  {
    icon: Fingerprint,
    title: "Private by default",
    description: "Your bookmarks are yours alone. No ads, no data selling.",
  },
  {
    icon: LayoutList,
    title: "Minimal interface",
    description:
      "No clutter, no distractions. Just your bookmarks in a clean, focused layout.",
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="space-y-6 sm:space-y-8">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-4 sm:gap-5">
            <div className="shrink-0 mt-0.5">
              <feature.icon
                className={cn(
                  "size-5 sm:size-6 text-foreground/70",
                  feature.className,
                )}
                strokeWidth={1.5}
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
