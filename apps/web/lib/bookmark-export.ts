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
  /** Full ISO 8601 timestamp */
  createdAtIso: string;
};

export function toExportedBookmark(
  input: BookmarkExportInput,
): ExportedBookmark {
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
  const headers = [
    "Title",
    "URL",
    "Type",
    "Color",
    "Group Name",
    "Created At",
  ];
  const rows = bookmarks.map((b) => [
    b.title,
    b.url,
    b.type,
    b.color ?? "",
    b.groupName,
    b.createdAt,
  ]);
  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

export function generateJSONExport(bookmarks: ExportedBookmark[]): string {
  return JSON.stringify(bookmarks, null, 2);
}

export function downloadBookmarksFile(options: {
  format: "json" | "csv";
  bookmarks: ExportedBookmark[];
  filenamePrefix?: string;
}): void {
  const date = new Date().toISOString().split("T")[0];
  const prefix = options.filenamePrefix ?? "OrgNote";
  const bookmarks = options.bookmarks;
  let content: string;
  let filename: string;
  let mimeType: string;
  if (options.format === "csv") {
    content = generateCSVExport(bookmarks);
    filename = `${prefix}-${date}.csv`;
    mimeType = "text/csv";
  } else {
    content = generateJSONExport(bookmarks);
    filename = `${prefix}-${date}.json`;
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
}
