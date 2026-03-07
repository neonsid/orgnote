"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface ExportedBookmark {
  title: string;
  url: string;
  type: "link";
  color: string | null;
  groupName: string;
  createdAt: string;
}
interface ExportBookmarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportFormat = "json" | "csv";

interface BookmarkWithGroup {
  _id: string;
  title: string;
  url: string;
  description?: string;
  imageUrl: string;
  doneReading: boolean;
  createdAt: number;
  groupId: string;
  groupTitle: string;
}

export function ExportBookmarksDialog({
  open,
  onOpenChange,
}: ExportBookmarksDialogProps) {
  const groups = useQuery(api.groups.list);
  const allBookmarks = useQuery(api.bookmarks.getAllUserBookmarks);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);

  const allGroupIds = new Set((groups ?? []).map((g) => g._id));

  const isAllSelected =
    selectedGroups.size === allGroupIds.size && allGroupIds.size > 0;

  useEffect(() => {
    if (groups && open) {
      setSelectedGroups(new Set(groups.map((g) => g._id)));
    }
  }, [groups, open]);

  const toggleGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(allGroupIds));
    }
  };

  const getTotalBookmarkCount = () => {
    if (!allBookmarks) return 0;
    return allBookmarks.filter((b) => selectedGroups.has(b.groupId)).length;
  };

  const formatBookmarkForExport = (
    bookmark: BookmarkWithGroup,
  ): ExportedBookmark => ({
    title: bookmark.title,
    url: bookmark.url,
    type: "link",
    color: null,
    groupName: bookmark.groupTitle,
    createdAt: new Date(bookmark.createdAt).toISOString(),
  });

  const generateCSVExport = (bookmarks: BookmarkWithGroup[]) => {
    const headers = [
      "Title",
      "URL",
      "Type",
      "Color",
      "Group Name",
      "Created At",
    ];
    const rows = bookmarks.map((b) => {
      const exported = formatBookmarkForExport(b);
      return [
        exported.title,
        exported.url,
        exported.type,
        exported.color ?? "",
        exported.groupName,
        exported.createdAt,
      ];
    });
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    return csv;
  };

  const handleExport = async () => {
    if (selectedGroups.size === 0) {
      toast.error("Please select at least one group");
      return;
    }

    if (!allBookmarks) {
      toast.error("No bookmarks found");
      return;
    }

    const bookmarksToExport = allBookmarks.filter((b) =>
      selectedGroups.has(b.groupId),
    );

    if (bookmarksToExport.length === 0) {
      toast.error("No bookmarks found in selected groups");
      return;
    }

    setIsExporting(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "csv") {
        content = generateCSVExport(bookmarksToExport);
        filename = `OrgNote-${date}.csv`;
        mimeType = "text/csv";
      } else {
        const formattedBookmarks = bookmarksToExport.map(
          formatBookmarkForExport,
        );
        content = JSON.stringify(formattedBookmarks, null, 2);
        filename = `OrgNote-${date}.json`;
        mimeType = "application/json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${bookmarksToExport.length} bookmarks`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to export bookmarks");
    } finally {
      setIsExporting(false);
    }
  };

  const totalCount = getTotalBookmarkCount();

  const getDropdownLabel = () => {
    if (isAllSelected) return "All groups";
    if (selectedGroups.size === 1 && groups) {
      const selectedGroup = groups.find((g) => selectedGroups.has(g._id));
      if (selectedGroup) return selectedGroup.title;
    }
    return `${selectedGroups.size} groups`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold">
            Export Bookmarks
          </DialogTitle>
          <p className="text-base text-muted-foreground">
            Choose which bookmarks to export and in what format.
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Groups</Label>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-base"
                >
                  <span>{getDropdownLabel()}</span>
                  <ChevronsUpDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
                align="start"
              >
                <DropdownMenuCheckboxItem
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  onSelect={(e) => e.preventDefault()}
                  className="text-base [&>span]:right-2 [&>span]:left-auto pr-8 pl-2"
                >
                  All groups
                </DropdownMenuCheckboxItem>
                {groups?.map((group) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={group._id}
                      checked={selectedGroups.has(group._id)}
                      onCheckedChange={() => toggleGroup(group._id)}
                      onSelect={(e) => e.preventDefault()}
                      className="text-base [&>span]:right-2 [&>span]:left-auto pr-8 pl-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span>{group.title}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <Label>Format</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat("json")}
                className={`flex items-center gap-2.5 rounded-md border px-4 py-2.5 text-sm ${
                  format === "json"
                    ? "border-primary bg-primary/10"
                    : "border-input hover:bg-accent"
                }`}
              >
                <div
                  className={`size-4 rounded-full border flex items-center justify-center ${
                    format === "json"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {format === "json" && (
                    <div className="size-2 rounded-full bg-background" />
                  )}
                </div>
                JSON
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`flex items-center gap-2.5 rounded-md border px-4 py-2.5 text-sm ${
                  format === "csv"
                    ? "border-primary bg-primary/10"
                    : "border-input hover:bg-accent"
                }`}
              >
                <div
                  className={`size-4 rounded-full border flex items-center justify-center ${
                    format === "csv"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {format === "csv" && (
                    <div className="size-2 rounded-full bg-background" />
                  )}
                </div>
                CSV
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Export {totalCount} bookmark{totalCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting || selectedGroups.size === 0 || totalCount === 0
            }
          >
            {isExporting ? "Exporting…" : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
