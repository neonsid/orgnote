"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { DashboardHeader } from "./dashboard-header";
import { BookmarkList, type Bookmark } from "./bookmark-list";
import { FilterDropdown, type FilterType } from "./filter-dropdown";
import { BookmarkSearch } from "./bookmark-search";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { type Id } from "@/convex/_generated/dataModel";
import { extractDomain } from "@/lib/domain-utils";
import { useDialogStore } from "@/stores/dialog-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { toast } from "sonner";

const RenameBookmarkDialog = dynamic(
  () => import("./rename-bookmark-dialog").then((m) => m.RenameBookmarkDialog),
  { ssr: false },
);

const EditBookmarkDialog = dynamic(
  () => import("./edit-bookmark-dialog").then((m) => m.EditBookmarkDialog),
  { ssr: false },
);

const DeleteBookmarkDialog = dynamic(
  () => import("./delete-bookmark-dialog").then((m) => m.DeleteBookmarkDialog),
  { ssr: false },
);

export default function DashboardPage() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const userId = session?.user?.id ?? "";

  // Unified dashboard data hook - single query for groups + bookmarks
  const { groups, bookmarks, effectiveGroupId, selectGroup, isLoading } =
    useDashboardData(userId);

  // Use ref to track current group without causing re-renders
  const effectiveGroupIdRef = useRef(effectiveGroupId);
  useEffect(() => {
    effectiveGroupIdRef.current = effectiveGroupId;
  }, [effectiveGroupId]);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Dialog state from Zustand store
  const {
    renameBookmark,
    editBookmark,
    deleteBookmark,
    openRenameDialog,
    openEditBookmarkDialog,
    closeRenameDialog,
    closeEditBookmarkDialog,
    openDeleteBookmarkDialog,
    closeDeleteBookmarkDialog,
  } = useDialogStore();

  const createBookmark = useMutation(api.bookmarks.createBookMark);
  const moveBookmark = useMutation(api.bookmarks.moveBookMark);
  const toggleReadStatus = useMutation(api.bookmarks.toggleReadStatus);

  const handleSubmitBookmark = useCallback(
    async (value: string) => {
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

      const currentGroupId = effectiveGroupIdRef.current;
      if (!currentGroupId) return;

      await createBookmark({
        title,
        url,
        groupId: currentGroupId as Id<"groups">,
        imageUrl: isUrl
          ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
          : "",
        userId,
      });
      setDebouncedQuery("");
    },
    [createBookmark, userId],
  );

  // Filter bookmarks client-side
  const filteredBookmarks = bookmarks.filter((b) => {
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      const matchesSearch =
        b.title.toLowerCase().includes(q) || b.domain.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    if (filter === "read") return b.doneReading;
    if (filter === "unread") return !b.doneReading;
    return true;
  });

  // Context menu handlers
  const handleCopy = useCallback((bookmark: Bookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("URL copied to clipboard");
  }, []);

  const handleRename = useCallback(
    (bookmark: Bookmark) => {
      openRenameDialog(bookmark.id, {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
      });
    },
    [openRenameDialog],
  );

  const handleEdit = useCallback(
    (bookmark: Bookmark) => {
      openEditBookmarkDialog(bookmark.id, {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
      });
    },
    [openEditBookmarkDialog],
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
      openDeleteBookmarkDialog(bookmark.id, {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
      });
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

  // Only block for session loading
  if (isSessionLoading) {
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
        onSelectGroup={selectGroup}
        userId={userId}
        user={session.user}
        loading={isLoading}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-2 sm:mt-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1">
            <BookmarkSearch
              onSearch={setDebouncedQuery}
              onSubmit={handleSubmitBookmark}
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

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="origin-left mb-2 px-2"
        >
          <div className="h-px bg-foreground/20 dark:bg-white/80" />
        </motion.div>

        <BookmarkList
          loading={isLoading}
          groups={groups}
          bookmarks={filteredBookmarks}
          onCopy={handleCopy}
          onRename={handleRename}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onToggleRead={handleToggleRead}
        />
      </main>

      <RenameBookmarkDialog
        bookmark={renameBookmark.bookmarkData}
        open={renameBookmark.open}
        onOpenChange={closeRenameDialog}
        userId={userId}
      />

      <EditBookmarkDialog
        bookmark={editBookmark.bookmarkData}
        open={editBookmark.open}
        onOpenChange={closeEditBookmarkDialog}
        userId={userId}
      />

      <DeleteBookmarkDialog
        bookmark={deleteBookmark.bookmarkData}
        open={deleteBookmark.open}
        onOpenChange={closeDeleteBookmarkDialog}
        userId={userId}
      />
    </div>
  );
}
