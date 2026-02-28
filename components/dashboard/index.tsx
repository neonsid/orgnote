"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { DashboardHeader } from "./dashboard-header";
import { FilterDropdown, type FilterType } from "./filter-dropdown";
import { GroupSelector } from "./group-selector";
import { BookmarkSearch } from "./bookmark-search";
import { BookmarkList, type Bookmark } from "./bookmark-list";
import { RenameBookmarkDialog } from "./rename-bookmark-dialog";
import { DeleteBookmarkDialog } from "./delete-bookmark-dialog";
import { type Doc, type Id } from "@/convex/_generated/dataModel";
import { extractDomain, COLORS } from "@/lib/domain-utils";

export default function DashboardPage() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const userId = session?.user?.id ?? "";

  // Fetch groups from Convex (skip query while session is loading)
  const groups = useQuery(api.groups.list, userId ? { userId } : "skip");

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Dialog coordination
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(
    null,
  );

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
    effectiveGroupId ? { groupId: effectiveGroupId as Id<"groups"> } : "skip",
  );

  const loadingBookMarks = effectiveGroupId
    ? convexBookmarks === undefined
    : false;

  const createBookmark = useMutation(api.bookmarks.createBookMark);
  const moveBookmark = useMutation(api.bookmarks.moveBookMark);
  const toggleReadStatus = useMutation(api.bookmarks.toggleReadStatus);

  const handleSubmit = useCallback(
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

      if (!effectiveGroupId) return;

      await createBookmark({
        title,
        url,
        groupId: effectiveGroupId as Id<"groups">,
        imageUrl: isUrl
          ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256`
          : "",
      });
      setDebouncedQuery("");
    },
    [effectiveGroupId, createBookmark],
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

  // Context menu handlers
  const handleCopy = useCallback((bookmark: Bookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("URL copied successfully");
  }, []);

  const handleRename = useCallback((bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setRenameDialogOpen(true);
  }, []);

  const handleMove = useCallback(
    (bookmarkId: Id<"bookmarks">, newGroupId: Id<"groups">) => {
      moveBookmark({ bookmarkId: bookmarkId, groupId: newGroupId });
    },
    [moveBookmark],
  );

  const handleDelete = useCallback((bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleRead = useCallback(
    (bookmarkId: Id<"bookmarks">) => {
      toggleReadStatus({ bookmarkId });
    },
    [toggleReadStatus],
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

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="origin-left mb-2 px-2"
        >
          <div className="h-px bg-foreground/20 dark:bg-white/80" />
        </motion.div>

        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center justify-center py-12 text-muted-foreground"
          >
            <p className="text-sm font-medium">No groups found</p>
            <p className="text-xs mt-1">
              Create a group to start adding bookmarks
            </p>
          </motion.div>
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
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      <DeleteBookmarkDialog
        bookmark={selectedBookmark}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
