import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useCallback } from "react";
import { extractDomain, COLORS } from "@/lib/domain-utils";
import type { Id } from "@/convex/_generated/dataModel";
import { useDashboardStore } from "@/stores/dashboard-store";
import { BOOKMARKS_PAGE_SIZE } from "@/convex/lib/constants";

interface Bookmark {
  id: Id<"bookmarks">;
  title: string;
  domain: string;
  url: string;
  favicon: string;
  fallbackColor: string;
  createdAt: string;
  groupId: Id<"groups">;
  doneReading: boolean;
  description?: string;
  publicListingBlockedForUrlSafety?: boolean;
}

export function useDashboardData(isAuthenticated: boolean = true) {
  const { selectedGroupId, setSelectedGroupId } = useDashboardStore();

  const groups = useQuery(
    api.groups.queries.list,
    isAuthenticated ? {} : "skip",
  );

  const isGroupsLoading = groups === undefined;

  const effectiveGroupId = useMemo(() => {
    const list = groups ?? [];
    if (selectedGroupId && list.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return list[0]?._id ?? "";
  }, [selectedGroupId, groups]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.bookmarks.queries.listBookmarksForGroupPaginated,
    isAuthenticated && effectiveGroupId
      ? { groupId: effectiveGroupId as Id<"groups"> }
      : "skip",
    { initialNumItems: BOOKMARKS_PAGE_SIZE },
  );

  const bookmarks = useMemo((): Bookmark[] => {
    if (!effectiveGroupId) return [];

    return results.map((b) => ({
      id: b._id,
      title: b.title,
      domain: extractDomain(b.url),
      url: b.url,
      favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(b.url)}&sz=64`,
      fallbackColor: COLORS[b.title.charCodeAt(0) % COLORS.length],
      createdAt: new Date(b._creationTime).toISOString().split("T")[0],
      groupId: b.groupId,
      doneReading: b.doneReading,
      description: b.description,
      publicListingBlockedForUrlSafety: b.publicListingBlockedForUrlSafety,
    }));
  }, [effectiveGroupId, results]);

  const selectGroup = useCallback(
    (id: Id<"groups"> | Id<"vaultGroups">) => {
      setSelectedGroupId(id as Id<"groups">);
    },
    [setSelectedGroupId],
  );

  const bookmarkPaginationStatus = effectiveGroupId ? status : undefined;

  const isLoading =
    isGroupsLoading ||
    (!!effectiveGroupId && status === "LoadingFirstPage");

  const loadMoreBookmarks = useCallback(() => {
    if (effectiveGroupId) {
      loadMore(BOOKMARKS_PAGE_SIZE);
    }
  }, [effectiveGroupId, loadMore]);

  return {
    groups: groups ?? [],
    bookmarks,
    effectiveGroupId,
    selectGroup,
    isLoading,
    bookmarkPaginationStatus,
    loadMoreBookmarks,
  };
}
