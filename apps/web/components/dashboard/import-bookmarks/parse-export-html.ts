import {
  UNCATEGORIZED_CHROME_FOLDER,
  dedupeItemsByUrl,
  parseBookmarkHtml,
  sortChromeFolderKeys,
  type ParsedImportItem,
} from "@/lib/bookmark-import";
import { MAX_BOOKMARK_IMPORT_HTML_BYTES } from "@/lib/url-limits";

/** Error message when a Netscape/HTML export contains no parseable links. */
export const NO_BOOKMARKS = "NO_BOOKMARKS";

/** Human label for a Chrome export folder key in the import UI. */
export function chromeFolderSelectLabel(key: string): string {
  if (key === UNCATEGORIZED_CHROME_FOLDER) return "No folder";
  return key;
}

/** Read and parse a browser bookmark HTML export (e.g. Chrome “Bookmarks.html”). */
export function parseBookmarkFile(file: File): Promise<{
  parsed: ParsedImportItem[];
  chromeFolderKeys: string[];
  fileName: string;
  skippedTooLongCount: number;
}> {
  if (file.size > MAX_BOOKMARK_IMPORT_HTML_BYTES) {
    return Promise.reject(
      new Error(
        `FILE_TOO_LARGE:${Math.round(MAX_BOOKMARK_IMPORT_HTML_BYTES / (1024 * 1024))}`,
      ),
    );
  }
  return file.text().then((text) => {
    const { items, chromeFolderKeys, skippedTooLongCount } =
      parseBookmarkHtml(text);
    const parsed = dedupeItemsByUrl(items);
    if (parsed.length === 0) {
      throw new Error(NO_BOOKMARKS);
    }
    const keys = new Set(chromeFolderKeys);
    if (!parsed.some((i) => i.folderPath.length === 0)) {
      keys.delete(UNCATEGORIZED_CHROME_FOLDER);
    }
    return {
      parsed,
      chromeFolderKeys: sortChromeFolderKeys(keys),
      fileName: file.name,
      skippedTooLongCount,
    };
  });
}
