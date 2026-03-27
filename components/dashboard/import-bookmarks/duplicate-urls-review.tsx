"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { m } from "motion/react";
import type { StagedImportPartition } from "@/lib/bookmark-import";

type GroupRow = { _id: string; title: string; color: string };

export interface DuplicateUrlsReviewProps {
  duplicatePartitions: Record<string, StagedImportPartition>;
  groups: GroupRow[] | undefined;
  isImporting: boolean;
  totalPendingCount: number;
  newOnlyImportCount: number;
  onImportAllDuplicates: () => void;
  onImportNewOnlyDuplicates: () => void;
  onCancel: () => void;
}

export const DuplicateUrlsReview = memo(function DuplicateUrlsReview({
  duplicatePartitions,
  groups,
  isImporting,
  totalPendingCount,
  newOnlyImportCount,
  onImportAllDuplicates,
  onImportNewOnlyDuplicates,
  onCancel,
}: DuplicateUrlsReviewProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-xl border border-border bg-muted/5 p-4 sm:p-6 space-y-4"
    >
      <div className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold">
          Review duplicate URLs
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Some links match a URL already in the target group, or the same URL
          appears more than once in this import. Comparisons use only the first
          100 bookmarks per group in your library; duplicates beyond that window
          may not be detected.
        </p>
      </div>
      <div className="min-h-0 max-h-[40vh] sm:max-h-[min(50vh,28rem)] space-y-3 overflow-y-auto overflow-x-hidden py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20">
        {Object.keys(duplicatePartitions)
          .sort((a, b) => {
            const ta = groups?.find((g) => g._id === a)?.title ?? a;
            const tb = groups?.find((g) => g._id === b)?.title ?? b;
            return ta.localeCompare(tb);
          })
          .map((gid, idx) => {
            const p = duplicatePartitions[gid];
            if (!p) return null;
            const g = groups?.find((x) => x._id === gid);
            const color = g?.color ?? "#888";
            return (
              <m.div
                key={gid}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="space-y-3 overflow-hidden rounded-lg border bg-background/50 p-3"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="min-w-0 truncate">
                    {g?.title ?? "Group"}
                  </span>
                </div>
                {p.dbDuplicates.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Already in group ({p.dbDuplicates.length})
                    </p>
                    <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
                      {p.dbDuplicates.map((item) => (
                        <li
                          key={item.id}
                          className="truncate py-0.5"
                          title={item.url}
                        >
                          {item.title || item.url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.batchDuplicates.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Listed twice in this import ({p.batchDuplicates.length})
                    </p>
                    <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
                      {p.batchDuplicates.map((item) => (
                        <li
                          key={item.id}
                          className="truncate py-0.5"
                          title={item.url}
                        >
                          {item.title || item.url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.newItems.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      New to group ({p.newItems.length})
                    </p>
                    <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
                      {p.newItems.map((item) => (
                        <li
                          key={item.id}
                          className="truncate py-0.5"
                          title={item.url}
                        >
                          {item.title || item.url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </m.div>
            );
          })}
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row-reverse sm:flex-wrap sm:justify-start">
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={isImporting || newOnlyImportCount === 0}
          title={
            newOnlyImportCount === 0
              ? "Nothing left that is not already in the group or a repeat in this import. Use the other button to import duplicates anyway, or cancel."
              : "Import only links that are new for each group (skips URLs already in the group and extra copies in this import)."
          }
          onClick={() => {
            void onImportNewOnlyDuplicates();
          }}
        >
          {newOnlyImportCount === 0
            ? "Nothing new to import"
            : newOnlyImportCount === 1
              ? "Import 1 new link only"
              : `Import ${newOnlyImportCount} new links only`}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isImporting}
          title="Import every link you staged for this run, including duplicates."
          onClick={() => {
            void onImportAllDuplicates();
          }}
        >
          {totalPendingCount === 1
            ? "Import 1 staged link"
            : `Import all ${totalPendingCount} staged`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto sm:mr-auto"
          disabled={isImporting}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </m.div>
  );
});
