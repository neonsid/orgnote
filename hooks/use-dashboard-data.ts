import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useCallback } from "react";
import { extractDomain, COLORS } from "@/lib/domain-utils";
import type { Id } from "@/convex/_generated/dataModel";
import { useDashboardStore } from "@/stores/dashboard-store";

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
}

export function useDashboardData(isAuthenticated: boolean = true) {
  const { selectedGroupId, setSelectedGroupId } = useDashboardStore();

  const dashboardData = useQuery(
    api.bookmarks.queries.getDashboardData,
    isAuthenticated ? {} : "skip",
  );

  const isLoading = dashboardData === undefined;

  const groups = useMemo(() => dashboardData?.groups ?? [], [dashboardData]);

  // Auto-select first group if none selected
  const effectiveGroupId = useMemo(() => {
    if (selectedGroupId && groups.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groups[0]?._id ?? "";
  }, [selectedGroupId, groups]);

  // Transform bookmarks for the selected group
  const bookmarks = useMemo((): Bookmark[] => {
    if (!dashboardData?.bookmarks) return [];

    return dashboardData.bookmarks
      .filter((b) => b.groupId === effectiveGroupId)
      .map((b) => ({
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
      }));
  }, [dashboardData, effectiveGroupId]);

  const selectGroup = useCallback(
    (id: Id<"groups"> | Id<"vaultGroups">) => {
      setSelectedGroupId(id as Id<"groups">);
    },
    [setSelectedGroupId],
  );

  return {
    groups,
    bookmarks,
    effectiveGroupId,
    selectGroup,
    isLoading,
  };
}
