"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Fish, Loader2, CheckCircle2, Circle, ListFilter } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { GroupSelector } from "@/components/dashboard/group-selector";
import { BookmarkSearch } from "@/components/dashboard/bookmark-search";
import {
  BookmarkList,
  type Bookmark,
} from "@/components/dashboard/bookmark-list";
import { UserInfo } from "@/components/dashboard/user-info";
import { RenameBookmarkDialog } from "@/components/dashboard/rename-bookmark-dialog";
import { DeleteBookmarkDialog } from "@/components/dashboard/delete-bookmark-dialog";
import { type Doc, type Id } from "@/convex/_generated/dataModel";
import { type ConvexGroup } from "@/components/dashboard/group-selector";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FilterType = "all" | "read" | "unread";

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

const FILTER_OPTIONS: {
  value: FilterType;
  label: string;
  icon: typeof Circle;
}[] = [
  { value: "all", label: "All", icon: ListFilter },
  { value: "read", label: "Read", icon: CheckCircle2 },
  { value: "unread", label: "Not Read", icon: Circle },
];

function extractDomain(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

interface DashboardHeaderProps {
  groups: ConvexGroup[];
  effectiveGroupId: string;
  onSelectGroup: (id: string) => void;
  userId: string;
  user: { id: string; name: string; email: string; image?: string | null };
}

const DashboardHeader = memo(function DashboardHeader({
  groups,
  effectiveGroupId,
  onSelectGroup,
  userId,
  user,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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
            onSelect={onSelectGroup}
            userId={userId}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme toggler — hidden on mobile, shown in UserInfo dropdown instead */}
          <div className="hidden sm:flex items-center justify-center rounded-md border border-input bg-background p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
            <AnimatedThemeToggler aria-label="Toggle theme" />
          </div>
          <UserInfo user={user} />
        </div>
      </div>
    </header>
  );
});

interface FilterDropdownProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
}

const FilterDropdown = memo(function FilterDropdown({
  value,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = FILTER_OPTIONS.find((o) => o.value === value);
  const Icon = selectedOption?.icon || ListFilter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
            open && "bg-accent",
          )}
        >
          <Icon className="size-4" />
          <span className="sm:inline">{selectedOption?.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        {FILTER_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors",
                value === option.value && "bg-accent",
              )}
            >
              <OptionIcon className="size-4" />
              {option.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
});

export default function DashboardPage() {
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();

  const userId = session?.user?.id ?? "";

  // Fetch groups from Convex (skip query while session is loading)
  const groups = useQuery(api.groups.list, userId ? { userId } : "skip");

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Dialog coordination — only open/close + which bookmark is selected
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

  // Fetch bookmarks from Convex (skip query while no group selected)
  const convexBookmarks = useQuery(
    api.bookmarks.listBookMarks,
    effectiveGroupId ? { groupId: effectiveGroupId as Id<"groups"> } : "skip",
  );

  const loadingBookMarks = convexBookmarks === undefined;

  const createBookmark = useMutation(api.bookmarks.createBookMark);
  const moveBookmark = useMutation(api.bookmarks.moveBookMark);
  const toggleReadStatus = useMutation(api.bookmarks.toggleReadStatus);

  const handleSubmit = useCallback(
    async (value: string) => {
      const domain = extractDomain(value);
      const isUrl = domain.includes(".");
      const title = isUrl
        ? domain.split(".")[0].charAt(0).toUpperCase() +
          domain.split(".")[0].slice(1)
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

    // Apply search filter
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.domain.toLowerCase().includes(q),
      );
    }

    // Apply read/unread filter
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
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Memoised header — isolated from search/bookmark state */}
      <DashboardHeader
        groups={groups}
        effectiveGroupId={effectiveGroupId}
        onSelectGroup={setSelectedGroupId}
        userId={userId}
        user={session.user}
      />

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 mt-2 sm:mt-10">
        <div className="mb-4 sm:mb-6">
          <BookmarkSearch
            onSearch={setDebouncedQuery}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="flex items-center justify-between mb-3 px-4 py-2 border-b">
          <span className="text-sm font-medium text-muted-foreground">
            Title
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              Created At
            </span>
            <FilterDropdown value={filter} onChange={setFilter} />
          </div>
        </div>

        <div className="rounded-xl overflow-hidden">
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
        </div>
      </main>

      {/* Rename Dialog — owns its own state for the title input */}
      <RenameBookmarkDialog
        bookmark={selectedBookmark}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      {/* Delete Dialog — owns its own mutation */}
      <DeleteBookmarkDialog
        bookmark={selectedBookmark}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
