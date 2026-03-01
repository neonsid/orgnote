"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { BookmarkList, type Bookmark } from "./bookmark-list";
import { RenameBookmarkDialog } from "./rename-bookmark-dialog";
import { DeleteBookmarkDialog } from "./delete-bookmark-dialog";
import { type Doc, type Id } from "@/convex/_generated/dataModel";
import { extractDomain, COLORS } from "@/lib/domain-utils";
import { useDialogStore } from "@/stores/dialog-store";
import type { FilterType } from "./filter-dropdown";

interface DashboardContentProps {
  initialFilter?: FilterType;
  debouncedQuery: string;
  filter: FilterType;
}

export function DashboardContent({
  debouncedQuery,
  filter,
}: DashboardContentProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";

  // Fetch groups from Convex
  const groups = useQuery(api.groups.list, userId ? { userId } : "skip");

  const [selectedGroupId] = useState<string>("");

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

  const moveBookmark = useMutation(api.bookmarks.moveBookMark);
  const toggleReadStatus = useMutation(api.bookmarks.toggleReadStatus);

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

  // Loading state with motion animation
  if (groups === undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-8 h-8 rounded-full bg-primary/20 mb-4"
        />
        <p className="text-sm font-medium animate-pulse">
          Loading bookmarks...
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {groups.length === 0 ? (
          <motion.div
            key="empty-groups"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          >
            <p className="text-sm font-medium">No groups found</p>
            <p className="text-xs mt-1">
              Create a group to start adding bookmarks
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="bookmark-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
    </>
  );
}
