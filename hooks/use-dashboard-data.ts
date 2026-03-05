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

export function useDashboardData(userId: string) {
  const { selectedGroupId, setSelectedGroupId } = useDashboardStore();

  // Single unified query for initial load
  const dashboardData = useQuery(
    api.bookmarks.getDashboardData,
    userId ? { userId } : "skip",
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
        id: b._id as Id<"bookmarks">,
        title: b.title,
        domain: extractDomain(b.url),
        url: b.url,
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(b.url)}&sz=64`,
        fallbackColor: COLORS[b.title.charCodeAt(0) % COLORS.length],
        createdAt: new Date(b.createdAt).toISOString().split("T")[0],
        groupId: b.groupId as Id<"groups">,
        doneReading: b.doneReading,
        description: b.description,
      }));
  }, [dashboardData, effectiveGroupId]);

  const selectGroup = useCallback(
    (id: string) => {
      setSelectedGroupId(id);
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
