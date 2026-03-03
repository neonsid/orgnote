"use client";

import { useState, useMemo, memo } from "react";
import { motion } from "motion/react";
import { extractDomain } from "@/lib/domain-utils";
import Image from "next/image";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import type { Id } from "@/convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  title: string;
  color: string;
}

interface Bookmark {
  _id: string;
  title: string;
  url: string;
  imageUrl: string;
  groupColor: string;
  groupId: string;
  createdAt: number;
}

interface PublicBookmarkListProps {
  groups: Group[];
  bookmarks: Bookmark[];
}

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// Memoized bookmark item to prevent unnecessary re-renders
const BookmarkItem = memo(function BookmarkItem({
  bookmark,
  index,
}: {
  bookmark: Bookmark;
  index: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="show"
      transition={{
        duration: 0.25,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-2 group hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {bookmark.imageUrl ? (
            <Image
              src={bookmark.imageUrl}
              alt=""
              width={20}
              height={20}
              className="size-5 rounded shrink-0"
              unoptimized
            />
          ) : (
            <div
              className="size-5 rounded flex items-center justify-center text-xs text-white font-medium shrink-0"
              style={{ backgroundColor: bookmark.groupColor }}
            >
              {bookmark.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {bookmark.title}
            </span>
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {extractDomain(bookmark.url)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-4">
          <span className="text-xs text-muted-foreground tabular-nums transition-transform duration-200 group-hover:-translate-x-1">
            {formatDate(bookmark.createdAt)}
          </span>
          <ArrowUpRight className="hidden size-4 text-muted-foreground group-hover:inline transition-all ease-in duration-400" />
        </div>
      </a>
    </motion.div>
  );
});

// Memoized group selector component
const GroupSelector = memo(function GroupSelector({
  groups,
  selectedGroupId,
  onSelectGroup,
}: {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelectGroup(null)}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          selectedGroupId === null
            ? "bg-foreground text-background"
            : "bg-muted text-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {groups.map((group) => (
        <button
          key={group._id}
          onClick={() => onSelectGroup(group._id as string)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedGroupId === group._id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: group.color }}
          />
          {group.title}
        </button>
      ))}
    </div>
  );
});

export const PublicBookmarkList = memo(function PublicBookmarkList({
  groups,
  bookmarks,
}: PublicBookmarkListProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Filter bookmarks by selected group
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    if (!selectedGroupId) return bookmarks;
    return bookmarks.filter((b) => b.groupId === selectedGroupId);
  }, [bookmarks, selectedGroupId]);

  return (
    <div className="space-y-6">
      {/* Group Tabs */}
      <GroupSelector
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
      />

      {/* Bookmark List Header */}
      <div className="flex items-center justify-between border-b border-border py-2">
        <span className="text-sm font-medium text-muted-foreground">Title</span>
        <span className="text-sm font-medium text-muted-foreground">
          Updated
        </span>
      </div>

      {/* Bookmark List */}
      <div className="space-y-2 -mt-2">
        {filteredBookmarks.map((bookmark, index) => (
          <BookmarkItem key={bookmark._id} bookmark={bookmark} index={index} />
        ))}
      </div>

      {/* Empty state if no bookmarks */}
      {filteredBookmarks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {groups?.length === 0
              ? "No public groups available"
              : selectedGroupId
                ? "No bookmarks in this group"
                : "No bookmarks in public groups"}
          </p>
        </div>
      )}
    </div>
  );
});
