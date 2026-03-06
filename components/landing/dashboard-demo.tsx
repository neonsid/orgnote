"use client";

import { memo, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { LandingGroupSelector } from "@/components/landing/landing-group-selector";
import { BookmarkSearch } from "@/components/dashboard/bookmark-search";
import {
  LandingBookmarkList,
  type LandingBookmark,
  type LandingGroup,
} from "@/components/landing/bookmark-list";
import {
  groups as initialGroups,
  bookmarks as initialBookmarks,
  type Group,
} from "@/lib/dummy-data";
import { toast } from "sonner";

// Dynamic import for rename dialog to enable code splitting
const LandingRenameBookmarkDialog = dynamic(
  () =>
    import("@/components/landing/rename-bookmark-dialog").then(
      (m) => m.LandingRenameBookmarkDialog,
    ),
  { ssr: false },
);

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

// ============================================================================
// Normalized Data Store Hook
// ============================================================================

interface BookmarkStore {
  byId: Map<string, LandingBookmark>;
  allIds: string[];
  idsByGroupId: Map<string, string[]>;
}

function normalizeBookmarks(bookmarks: LandingBookmark[]): BookmarkStore {
  const byId = new Map<string, LandingBookmark>();
  const allIds: string[] = [];
  const idsByGroupId = new Map<string, string[]>();

  for (const b of bookmarks) {
    byId.set(b.id, b);
    allIds.push(b.id);

    const groupIds = idsByGroupId.get(b.groupId) || [];
    groupIds.push(b.id);
    idsByGroupId.set(b.groupId, groupIds);
  }

  return { byId, allIds, idsByGroupId };
}

function useBookmarkStore(initialData: LandingBookmark[]) {
  const [store, setStore] = useState<BookmarkStore>(() =>
    normalizeBookmarks(initialData),
  );

  const addBookmark = useCallback((bookmark: LandingBookmark) => {
    setStore((prev) => {
      const byId = new Map(prev.byId);
      const allIds = [bookmark.id, ...prev.allIds];
      const idsByGroupId = new Map(prev.idsByGroupId);

      byId.set(bookmark.id, bookmark);

      const groupIds = idsByGroupId.get(bookmark.groupId) || [];
      idsByGroupId.set(bookmark.groupId, [bookmark.id, ...groupIds]);

      return { byId, allIds, idsByGroupId };
    });
  }, []);

  const updateBookmark = useCallback(
    (id: string, updater: (b: LandingBookmark) => LandingBookmark) => {
      setStore((prev) => {
        const bookmark = prev.byId.get(id);
        if (!bookmark) return prev;

        const updated = updater(bookmark);
        const byId = new Map(prev.byId);
        byId.set(id, updated);

        // If group changed, update indices
        const idsByGroupId = new Map(prev.idsByGroupId);
        if (updated.groupId !== bookmark.groupId) {
          // Remove from old group
          const oldGroupIds = idsByGroupId.get(bookmark.groupId) || [];
          idsByGroupId.set(
            bookmark.groupId,
            oldGroupIds.filter((bid) => bid !== id),
          );
          // Add to new group
          const newGroupIds = idsByGroupId.get(updated.groupId) || [];
          idsByGroupId.set(updated.groupId, [id, ...newGroupIds]);
        }

        return { ...prev, byId, idsByGroupId };
      });
    },
    [],
  );

  const deleteBookmark = useCallback((id: string) => {
    setStore((prev) => {
      const bookmark = prev.byId.get(id);
      if (!bookmark) return prev;

      const byId = new Map(prev.byId);
      byId.delete(id);

      const allIds = prev.allIds.filter((bid) => bid !== id);

      const idsByGroupId = new Map(prev.idsByGroupId);
      const groupIds = idsByGroupId.get(bookmark.groupId) || [];
      idsByGroupId.set(
        bookmark.groupId,
        groupIds.filter((bid) => bid !== id),
      );

      return { byId, allIds, idsByGroupId };
    });
  }, []);

  return { store, addBookmark, updateBookmark, deleteBookmark };
}

// ============================================================================
// Memoized Child Components
// ============================================================================

const DemoHeader = memo(function DemoHeader({
  selectedGroupId,
  allGroups,
  onSelectGroup,
  onCreateGroup,
}: {
  selectedGroupId: string;
  allGroups: Group[];
  onSelectGroup: (id: string) => void;
  onCreateGroup: (group: Group) => void;
}) {
  return (
    <div className="flex items-center px-3 sm:px-5 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="size-7 sm:size-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-border flex items-center justify-center p-1">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={20}
            height={20}
            className="size-4 sm:size-5"
          />
        </div>
        <span className="text-muted-foreground select-none">/</span>
        <LandingGroupSelector
          groups={allGroups}
          selectedGroupId={selectedGroupId}
          onSelect={onSelectGroup}
          onCreateGroup={onCreateGroup}
        />
      </div>
    </div>
  );
});

const DemoSearch = memo(function DemoSearch({
  onSearch,
  onSubmit,
}: {
  onSearch: (q: string) => void;
  onSubmit: (v: string) => void;
}) {
  return (
    <div className="px-3 sm:px-5 sm:pt-4 my-1 sm:pb-3">
      <BookmarkSearch onSearch={onSearch} onSubmit={onSubmit} />
    </div>
  );
});

const DemoListPane = memo(function DemoListPane({
  filteredBookmarks,
  allGroups,
  onCopy,
  onRename,
  onDelete,
  onMove,
}: {
  filteredBookmarks: LandingBookmark[];
  allGroups: LandingGroup[];
  onCopy: (b: LandingBookmark) => void;
  onRename: (b: LandingBookmark) => void;
  onDelete: (b: LandingBookmark) => void;
  onMove: (id: string, gid: string) => void;
}) {
  return (
    <div className="px-3 sm:px-5">
      <LandingBookmarkList
        bookmarks={filteredBookmarks}
        groups={allGroups}
        onCopy={onCopy}
        onRename={onRename}
        onDelete={onDelete}
        onMove={onMove}
      />
    </div>
  );
});

// ============================================================================
// Rename Dialog Host - Isolated state to prevent parent re-renders
// ============================================================================

interface RenameDialogHostProps {
  onConfirm: (bookmarkId: string, newTitle: string) => void;
  children: (props: {
    onRename: (bookmark: LandingBookmark) => void;
  }) => React.ReactNode;
}

const RenameDialogHost = memo(function RenameDialogHost({
  onConfirm,
  children,
}: RenameDialogHostProps) {
  const [open, setOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] =
    useState<LandingBookmark | null>(null);

  const handleRename = useCallback((bookmark: LandingBookmark) => {
    setSelectedBookmark(bookmark);
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(
    (bookmarkId: string, newTitle: string) => {
      onConfirm(bookmarkId, newTitle);
      setOpen(false);
    },
    [onConfirm],
  );

  return (
    <>
      {children({ onRename: handleRename })}
      <LandingRenameBookmarkDialog
        bookmark={selectedBookmark}
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </>
  );
});

// ============================================================================
// Main Dashboard Demo
// ============================================================================

export function DashboardDemo() {
  const [selectedGroupId, setSelectedGroupId] = useState("personal");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Ephemeral groups
  const [allGroups, setAllGroups] = useState<Group[]>(initialGroups);

  // Normalized bookmark store
  const initialBookmarksMemo = useMemo(
    () =>
      initialBookmarks.map((b) => ({
        ...b,
        favicon: b.favicon,
      })),
    [],
  );
  const { store, addBookmark, updateBookmark, deleteBookmark } =
    useBookmarkStore(initialBookmarksMemo);

  // Stable group handler
  const handleCreateGroup = useCallback((newGroup: Group) => {
    setAllGroups((prev) => [...prev, newGroup]);
  }, []);

  // Stable submit handler
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

      addBookmark(newBookmark);
      setDebouncedQuery("");
    },
    [selectedGroupId, addBookmark],
  );

  // Compute filtered bookmarks - only recompute when necessary
  const filteredBookmarks = useMemo(() => {
    const groupIds = store.idsByGroupId.get(selectedGroupId) || [];
    let bookmarks = groupIds.map((id) => store.byId.get(id)!);

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      bookmarks = bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.domain.toLowerCase().includes(q),
      );
    }

    return bookmarks;
  }, [store, selectedGroupId, debouncedQuery]);

  // Stable context menu handlers
  const handleCopy = useCallback((bookmark: LandingBookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("URL copied to clipboard");
  }, []);

  // Use functional updates to avoid dependencies in callbacks
  const handleRenameConfirm = useCallback(
    (bookmarkId: string, newTitle: string) => {
      updateBookmark(bookmarkId, (b) => ({ ...b, title: newTitle }));
      toast.success(`Renamed to "${newTitle}"`);
    },
    [updateBookmark],
  );

  const handleDelete = useCallback(
    (bookmark: LandingBookmark) => {
      deleteBookmark(bookmark.id);
      toast.success(`"${bookmark.title}" deleted`);
    },
    [deleteBookmark],
  );

  const handleMove = useCallback(
    (bookmarkId: string, newGroupId: string) => {
      updateBookmark(bookmarkId, (b) => ({ ...b, groupId: newGroupId }));

      const groupName =
        allGroups.find((g) => g.id === newGroupId)?.name || "Unknown";
      toast.success(`Moved to ${groupName}`);
    },
    [updateBookmark, allGroups],
  );

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      <DemoHeader
        selectedGroupId={selectedGroupId}
        allGroups={allGroups}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={handleCreateGroup}
      />

      <DemoSearch onSearch={setDebouncedQuery} onSubmit={handleSubmit} />

      <RenameDialogHost onConfirm={handleRenameConfirm}>
        {({ onRename }) => (
          <DemoListPane
            filteredBookmarks={filteredBookmarks}
            allGroups={allGroups}
            onCopy={handleCopy}
            onRename={onRename}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        )}
      </RenameDialogHost>
    </div>
  );
}
