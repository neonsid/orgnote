"use client";

import { useState, useMemo, useCallback } from "react";
import { Fish, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { GroupSelector } from "@/components/dashboard/group-selector";
import { BookmarkSearch } from "@/components/dashboard/bookmark-search";
import { BookmarkList } from "@/components/dashboard/bookmark-list";
import { UserInfo } from "@/components/dashboard/user-info";
import { type Bookmark, bookmarks as initialBookmarks } from "@/lib/dummy-data";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

function extractDomain(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const userId = session?.user?.id ?? "";

  // Fetch groups from Convex (skip query while session is loading)
  const groups = useQuery(api.groups.list, userId ? { userId } : "skip");

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [tempBookmarks, setTempBookmarks] = useState<Bookmark[]>([]);

  // Auto-select the first group when groups load
  const effectiveGroupId = useMemo(() => {
    if (selectedGroupId && groups?.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groups?.[0]?._id ?? "";
  }, [selectedGroupId, groups]);

  const handleSubmit = useCallback(
    (value: string) => {
      const domain = extractDomain(value);
      const isUrl = domain.includes(".");
      const title = isUrl
        ? domain.split(".")[0].charAt(0).toUpperCase() +
          domain.split(".")[0].slice(1)
        : value;

      const newBookmark: Bookmark = {
        id: `temp-${Date.now()}`,
        title,
        domain: isUrl ? domain : "",
        url: isUrl
          ? value.startsWith("http")
            ? value
            : `https://${value}`
          : "#",
        favicon: isUrl
          ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
          : null,
        fallbackColor: COLORS[Math.floor(Math.random() * COLORS.length)],
        createdAt: new Date().toISOString().split("T")[0],
        groupId: effectiveGroupId,
      };

      setTempBookmarks((prev) => [newBookmark, ...prev]);
      setSearch("");
    },
    [effectiveGroupId],
  );

  const allBookmarks = useMemo(() => {
    const groupTemp = tempBookmarks.filter(
      (b) => b.groupId === effectiveGroupId,
    );
    const groupInitial = initialBookmarks.filter(
      (b) => b.groupId === effectiveGroupId,
    );
    return [...groupTemp, ...groupInitial];
  }, [effectiveGroupId, tempBookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (!search.trim()) return allBookmarks;
    const q = search.toLowerCase();
    return allBookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q),
    );
  }, [allBookmarks, search]);

  // Loading state while session or groups are being fetched
  if (isSessionLoading || groups === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Please sign in to view your dashboard.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dashboard header */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <div className="size-8 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center">
                <Fish
                  className="size-5 text-blue-600 dark:text-blue-400"
                  strokeWidth={1.5}
                />
              </div>
            </Link>
            <span className="text-muted-foreground select-none">/</span>
            <GroupSelector
              groups={groups}
              selectedGroupId={effectiveGroupId}
              onSelect={setSelectedGroupId}
              userId={userId}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md border border-input bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
              <AnimatedThemeToggler aria-label="Toggle theme" />
            </div>
            <UserInfo user={session.user} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <BookmarkSearch
            value={search}
            onChange={setSearch}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="rounded-xl bg-card shadow-sm overflow-hidden">
          <BookmarkList bookmarks={filteredBookmarks} />
        </div>

        <div className="mt-3 sm:mt-4 px-1 text-xs text-muted-foreground">
          {filteredBookmarks.length} bookmark
          {filteredBookmarks.length !== 1 ? "s" : ""}
          {search && " found"}
        </div>
      </main>
    </div>
  );
}
