"use client";

import { memo } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { StagedImportPartition } from "@/lib/bookmark-import";

type GroupRow = { _id: string; title: string; color: string };

export interface DuplicateUrlsAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicatePartitions: Record<string, StagedImportPartition>;
  groups: GroupRow[] | undefined;
  isImporting: boolean;
  totalPendingCount: number;
  newOnlyImportCount: number;
  onImportAllDuplicates: () => void;
  onImportNewOnlyDuplicates: () => void;
}

/** Alert shown when staged import URLs overlap the library or repeat within the batch. */
export const DuplicateUrlsAlertDialog = memo(function DuplicateUrlsAlertDialog({
  open,
  onOpenChange,
  duplicatePartitions,
  groups,
  isImporting,
  totalPendingCount,
  newOnlyImportCount,
  onImportAllDuplicates,
  onImportNewOnlyDuplicates,
}: DuplicateUrlsAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="flex max-h-[min(85vh,28rem)] w-full max-w-lg flex-col gap-4 p-6">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>Review duplicate URLs</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Some links match a URL already in the target group, or the same URL
            appears more than once in this import. Comparisons use only the first
            100 bookmarks per group in your library; duplicates beyond that window
            may not be detected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden py-1">
          {Object.keys(duplicatePartitions)
            .sort((a, b) => {
              const ta = groups?.find((g) => g._id === a)?.title ?? a;
              const tb = groups?.find((g) => g._id === b)?.title ?? b;
              return ta.localeCompare(tb);
            })
            .map((gid) => {
              const p = duplicatePartitions[gid];
              if (!p) return null;
              const g = groups?.find((x) => x._id === gid);
              return (
                <div
                  key={gid}
                  className="space-y-3 rounded-md border bg-muted/5 p-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: g?.color ?? "#888" }}
                    />
                    <span className="min-w-0 truncate">
                      {g?.title ?? "Group"}
                    </span>
                  </div>
                  {p.dbDuplicates.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Already in group
                      </p>
                      <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded border bg-background/50 px-2 py-1 text-xs">
                        {p.dbDuplicates.map((item) => (
                          <li
                            key={item.id}
                            className="truncate"
                            title={item.url}
                          >
                            {item.title || item.url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.batchDuplicates.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Listed twice in this import
                      </p>
                      <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded border bg-background/50 px-2 py-1 text-xs">
                        {p.batchDuplicates.map((item) => (
                          <li
                            key={item.id}
                            className="truncate"
                            title={item.url}
                          >
                            {item.title || item.url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.newItems.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        New to group
                      </p>
                      <ul className="max-h-28 space-y-0.5 overflow-y-auto rounded border bg-background/50 px-2 py-1 text-xs">
                        {p.newItems.map((item) => (
                          <li
                            key={item.id}
                            className="truncate"
                            title={item.url}
                          >
                            {item.title || item.url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        <AlertDialogFooter className="shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          <AlertDialogCancel
            className="m-0 w-full sm:w-auto"
            disabled={isImporting}
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
            disabled={isImporting}
            title="Import every link you staged for this run, including duplicates."
            onClick={() => {
              void onImportAllDuplicates();
            }}
          >
            {totalPendingCount === 1
              ? "Import 1 staged link"
              : `Import ${totalPendingCount} staged links`}
          </Button>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
})
