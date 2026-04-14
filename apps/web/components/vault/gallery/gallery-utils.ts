import type { VaultFile } from "@/components/dashboard/bookmark-list/types";
import type { VaultSortType } from "@/components/vault/sort-dropdown";
import type { UploadFileItem } from "@/components/vault/hooks/useFileUploader";

export function isImage(type: string): boolean {
  return type.startsWith("image/");
}

export function isPdf(type: string): boolean {
  return type.includes("pdf");
}

function compareId(a: VaultFile, b: VaultFile): number {
  return String(a._id).localeCompare(String(b._id));
}

/**
 * While Convex catches up, a completed upload can still sit in local state with
 * the same URL as a row in `files` — hide the upload tile so we never show two
 * thumbnails for one object.
 */
export function filterUploadsNotYetInFiles(
  uploadFiles: UploadFileItem[],
  files: VaultFile[],
): UploadFileItem[] {
  const urls = new Set(files.map((f) => f.url));
  return uploadFiles.filter((u) => {
    if (u.status !== "completed" || !u.fileUrl) return true;
    return !urls.has(u.fileUrl);
  });
}

/**
 * Date order is oldest → newest so a file that just finished uploading stays at
 * the end of the grid next to in-progress uploads (same visual slot as before
 * it left the upload row).
 */
export function sortVaultFiles(
  files: VaultFile[],
  sortBy: VaultSortType,
): VaultFile[] {
  return [...files].sort((a, b) => {
    if (sortBy === "latest") {
      const byTime = a._creationTime - b._creationTime;
      if (byTime !== 0) return byTime;
      return compareId(a, b);
    }
    if (sortBy === "size") {
      const bySize = b.size - a.size;
      if (bySize !== 0) return bySize;
      return compareId(a, b);
    }
    const byName = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    });
    if (byName !== 0) return byName;
    return compareId(a, b);
  });
}
