/**
 * Same shape as `apps/web/lib/bookmark-export.ts` for CSV/JSON compatibility.
 */
export type ExportedBookmark = {
  title: string;
  url: string;
  type: "link";
  color: string | null;
  groupName: string;
  createdAt: string;
};

export type BookmarkExportInput = {
  title: string;
  url: string;
  groupName: string;
  createdAtIso: string;
};

export function toExportedBookmark(input: BookmarkExportInput): ExportedBookmark {
  return {
    title: input.title,
    url: input.url,
    type: "link",
    color: null,
    groupName: input.groupName,
    createdAt: input.createdAtIso,
  };
}

export function generateCSVExport(bookmarks: ExportedBookmark[]): string {
  const headers = ["Title", "URL", "Type", "Color", "Group Name", "Created At"];
  const rows = bookmarks.map((b) => [
    b.title,
    b.url,
    b.type,
    b.color ?? "",
    b.groupName,
    b.createdAt,
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function generateJSONExport(bookmarks: ExportedBookmark[]): string {
  return JSON.stringify(bookmarks, null, 2);
}
