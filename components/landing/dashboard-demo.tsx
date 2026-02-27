"use client";

import { useState, useMemo, useCallback } from "react";
import Fish from "lucide-react/dist/esm/icons/fish";
import { LandingGroupSelector } from "@/components/landing/landing-group-selector";
import { BookmarkSearch } from "@/components/dashboard/bookmark-search";
import {
  LandingBookmarkList,
  type LandingBookmark,
} from "@/components/landing/bookmark-list";
import { LandingRenameBookmarkDialog } from "@/components/landing/rename-bookmark-dialog";
import {
  groups as initialGroups,
  bookmarks as initialBookmarks,
  type Group,
} from "@/lib/dummy-data";
import { toast } from "sonner";

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

export function DashboardDemo() {
  const [selectedGroupId, setSelectedGroupId] = useState("personal");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tempBookmarks, setTempBookmarks] = useState<LandingBookmark[]>([]);
  // Ephemeral groups: starts with dummy-data groups, user can add more (lost on refresh)
  const [allGroups, setAllGroups] = useState<Group[]>(initialGroups);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] =
    useState<LandingBookmark | null>(null);

  const handleCreateGroup = useCallback((newGroup: Group) => {
    setAllGroups((prev) => [...prev, newGroup]);
  }, []);

  const handleSubmit = useCallback(
    (value: string) => {
      const domain = extractDomain(value);
      const isUrl = domain.includes(".");
      const domainName = isUrl ? domain.split(".")[0] : "";
      const title = isUrl
        ? domainName.charAt(0).toUpperCase() + domainName.slice(1)
        : value;

      const newBookmark: LandingBookmark = {
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
        groupId: selectedGroupId,
      };

      setTempBookmarks((prev) => [newBookmark, ...prev]);
      setDebouncedQuery("");
    },
    [selectedGroupId],
  );

  // All bookmarks (both from dummy data and temp)
  const [bookmarksMap, setBookmarksMap] = useState<
    Map<string, LandingBookmark>
  >(() => {
    const map = new Map<string, LandingBookmark>();
    initialBookmarks.forEach((b) => {
      map.set(b.id, {
        ...b,
        favicon: b.favicon,
      });
    });
    return map;
  });

  const allBookmarks = useMemo(() => {
    const groupTemp = tempBookmarks.filter(
      (b) => b.groupId === selectedGroupId,
    );
    const groupInitial = Array.from(bookmarksMap.values()).filter(
      (b) => b.groupId === selectedGroupId,
    );
    return [...groupTemp, ...groupInitial];
  }, [selectedGroupId, tempBookmarks, bookmarksMap]);

  const filteredBookmarks = useMemo(() => {
    if (!debouncedQuery.trim()) return allBookmarks;
    const q = debouncedQuery.toLowerCase();
    return allBookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q),
    );
  }, [allBookmarks, debouncedQuery]);

  // Context menu handlers - now with actual implementation
  const handleCopy = useCallback((bookmark: LandingBookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("URL copied to clipboard");
  }, []);

  const handleRename = useCallback((bookmark: LandingBookmark) => {
    setSelectedBookmark(bookmark);
    setRenameDialogOpen(true);
  }, []);

  const handleRenameConfirm = useCallback(
    (bookmarkId: string, newTitle: string) => {
      // Check if it's a temp bookmark
      const tempBookmark = tempBookmarks.find((b) => b.id === bookmarkId);
      if (tempBookmark) {
        setTempBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmarkId ? { ...b, title: newTitle } : b,
          ),
        );
      } else {
        // It's in bookmarksMap
        setBookmarksMap((prev) => {
          const newMap = new Map(prev);
          const bookmark = newMap.get(bookmarkId);
          if (bookmark) {
            newMap.set(bookmarkId, { ...bookmark, title: newTitle });
          }
          return newMap;
        });
      }
      toast.success(`Renamed to "${newTitle}"`);
    },
    [tempBookmarks],
  );

  const handleDelete = useCallback((bookmark: LandingBookmark) => {
    setBookmarksMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(bookmark.id);
      return newMap;
    });
    setTempBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
    toast.success(`"${bookmark.title}" deleted`);
  }, []);

  const handleMove = useCallback(
    (bookmarkId: string, newGroupId: string) => {
      // Check if it's a temp bookmark
      const tempBookmark = tempBookmarks.find((b) => b.id === bookmarkId);
      if (tempBookmark) {
        setTempBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmarkId ? { ...b, groupId: newGroupId } : b,
          ),
        );
      } else {
        // It's in bookmarksMap
        setBookmarksMap((prev) => {
          const newMap = new Map(prev);
          const bookmark = newMap.get(bookmarkId);
          if (bookmark) {
            newMap.set(bookmarkId, { ...bookmark, groupId: newGroupId });
          }
          return newMap;
        });
      }

      const groupName =
        allGroups.find((g) => g.id === newGroupId)?.name || "Unknown";
      toast.success(`Moved to ${groupName}`);
    },
    [tempBookmarks, allGroups],
  );

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      {/* Mini header */}
      <div className="flex items-center px-3 sm:px-5 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="size-7 sm:size-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center">
            <Fish
              className="size-4 sm:size-5 text-blue-600 dark:text-blue-400"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-muted-foreground select-none">/</span>
          <LandingGroupSelector
            groups={allGroups}
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
            onCreateGroup={handleCreateGroup}
          />
        </div>
      </div>

      {/* Hybrid input */}
      <div className="px-3 sm:px-5 sm:pt-4 my-1 sm:pb-3">
        <BookmarkSearch onSearch={setDebouncedQuery} onSubmit={handleSubmit} />
      </div>

      {/* Bookmark list */}
      <div className="px-3 sm:px-5">
        <LandingBookmarkList
          bookmarks={filteredBookmarks}
          groups={allGroups}
          onCopy={handleCopy}
          onRename={handleRename}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      </div>

      {/* Footer count */}

      {/* Rename Dialog */}
      <LandingRenameBookmarkDialog
        bookmark={selectedBookmark}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onConfirm={handleRenameConfirm}
      />
    </div>
  );
}
