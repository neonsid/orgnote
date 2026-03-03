"use client";

import { useState, useMemo, useCallback } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { DashboardHeader } from "./dashboard-header";
import { FilterDropdown, type FilterType } from "./filter-dropdown";
import { BookmarkSearch } from "./bookmark-search";
import { BookmarkList, type Bookmark } from "./bookmark-list";
import { RenameBookmarkDialog } from "./rename-bookmark-dialog";
import { DeleteBookmarkDialog } from "./delete-bookmark-dialog";
import { type Doc, type Id } from "@/convex/_generated/dataModel";
import { extractDomain, COLORS } from "@/lib/domain-utils";
import { useDialogStore } from "@/stores/dialog-store";

export default function DashboardPage() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const userId = session?.user?.id ?? "";

  // Fetch groups from Convex (skip query while session is loading)
  const groups = useQuery(api.groups.list, userId ? { userId } : "skip");

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Dialog state from Zustand store
  const {
    renameBookmark,
    deleteBookmark,
    openRenameDialog,
    closeRenameDialog,
    openDeleteBookmarkDialog,
    closeDeleteBookmarkDialog,
  } = useDialogStore();

  // Auto-select the first group when groups load
  const effectiveGroupId = useMemo(() => {
    if (selectedGroupId && groups?.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groups?.[0]?._id ?? "";
  }, [selectedGroupId, groups]);

  // Fetch bookmarks from Convex
  const convexBookmarks = useQuery(
    api.bookmarks.listBookMarks,
    effectiveGroupId && userId
      ? { groupId: effectiveGroupId as Id<"groups">, userId }
      : "skip",
  );

  const loadingBookMarks = effectiveGroupId
    ? convexBookmarks === undefined
    : false;

  const createBookmark = useMutation(api.bookmarks.createBookMark);
  const moveBookmark = useMutation(api.bookmarks.moveBookMark);
  const toggleReadStatus = useMutation(api.bookmarks.toggleReadStatus);

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!effectiveGroupId || !userId) {
        toast.error("Please select a group first");
        return;
      }

      const domain = extractDomain(value);
      const isUrl = domain.includes(".");
      const domainName = isUrl ? domain.split(".")[0] : "";
      const title = isUrl
        ? domainName.charAt(0).toUpperCase() + domainName.slice(1)
        : value;

      const url = isUrl
        ? value.startsWith("http")
          ? value
          : `https://${value}`
        : "#";

      try {
        await createBookmark({
          title,
          url,
          groupId: effectiveGroupId as Id<"groups">,
          imageUrl: isUrl
            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
            : "",
          userId,
        });
        toast.success("Bookmark created successfully");
        setDebouncedQuery("");
      } catch (error) {
        toast.error("Failed to create bookmark");
        console.error("Error creating bookmark:", error);
      }
    },
    [effectiveGroupId, createBookmark, userId],
  );

  const allBookmarks = useMemo(() => {
    if (!convexBookmarks) return [];
    return convexBookmarks.map((b: Doc<"bookmarks">) => ({
      id: b._id,
      title: b.title,
      domain: extractDomain(b.url),
      url: b.url,
      favicon: b.imageUrl || null,
      fallbackColor: COLORS[b.title.charCodeAt(0) % COLORS.length],
      createdAt: new Date(b.createdAt).toISOString().split("T")[0],
      groupId: b.groupId,
      doneReading: b.doneReading,
    }));
  }, [convexBookmarks]);

  const filteredBookmarks: Bookmark[] = useMemo(() => {
    let result = allBookmarks;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.domain.toLowerCase().includes(q),
      );
    }

    if (filter === "read") {
      result = result.filter((b) => b.doneReading);
    } else if (filter === "unread") {
      result = result.filter((b) => !b.doneReading);
    }

    return result;
  }, [allBookmarks, debouncedQuery, filter]);

  // Get selected bookmark from store bookmarkId
  const selectedBookmark = useMemo(() => {
    const bookmarkId = renameBookmark.bookmarkId || deleteBookmark.bookmarkId;
    if (!bookmarkId) return null;
    return allBookmarks.find((b) => b.id === bookmarkId) || null;
  }, [allBookmarks, renameBookmark.bookmarkId, deleteBookmark.bookmarkId]);

  // Context menu handlers
  const handleCopy = useCallback((bookmark: Bookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("URL copied successfully");
  }, []);

  const handleRename = useCallback(
    (bookmark: Bookmark) => {
      openRenameDialog(bookmark.id);
    },
    [openRenameDialog],
  );

  const handleMove = useCallback(
    (bookmarkId: Id<"bookmarks">, newGroupId: Id<"groups">) => {
      if (!userId) return;
      moveBookmark({ bookmarkId: bookmarkId, groupId: newGroupId, userId });
    },
    [moveBookmark, userId],
  );

  const handleDelete = useCallback(
    (bookmark: Bookmark) => {
      openDeleteBookmarkDialog(bookmark.id);
    },
    [openDeleteBookmarkDialog],
  );

  const handleToggleRead = useCallback(
    (bookmarkId: Id<"bookmarks">) => {
      if (!userId) return;
      toggleReadStatus({ bookmarkId, userId });
    },
    [toggleReadStatus, userId],
  );

  // Loading state
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
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <DashboardHeader
        groups={groups}
        effectiveGroupId={effectiveGroupId}
        onSelectGroup={setSelectedGroupId}
        userId={userId}
        user={session.user}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-2 sm:mt-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1">
            <BookmarkSearch
              onSearch={setDebouncedQuery}
              onSubmit={handleSubmit}
            />
          </div>
          <FilterDropdown value={filter} onChange={setFilter} />
        </div>

        <div className="flex items-center justify-between px-3 mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Title
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Created At
          </span>
        </div>

        <div className="origin-left mb-2 px-2 animate-in zoom-in-0 duration-500 delay-100">
          <div className="h-px bg-foreground/20 dark:bg-white/80" />
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-500">
            <p className="text-sm font-medium">No groups found</p>
            <p className="text-xs mt-1">
              Create a group to start adding bookmarks
            </p>
          </div>
        ) : (
          <BookmarkList
            loading={loadingBookMarks}
            groups={groups}
            bookmarks={filteredBookmarks}
            onCopy={handleCopy}
            onRename={handleRename}
            onDelete={handleDelete}
            onMove={handleMove}
            onToggleRead={handleToggleRead}
          />
        )}
      </main>

      <RenameBookmarkDialog
        bookmark={selectedBookmark}
        open={renameBookmark.open}
        onOpenChange={closeRenameDialog}
        userId={userId}
      />

      <DeleteBookmarkDialog
        bookmark={selectedBookmark}
        open={deleteBookmark.open}
        onOpenChange={closeDeleteBookmarkDialog}
        userId={userId}
      />
    </div>
  );
}
