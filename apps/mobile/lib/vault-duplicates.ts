import type { Id } from "../../../convex/_generated/dataModel";

export type VaultFileRow = {
  _id: Id<"vaultFiles">;
  name: string;
  size: number;
  _creationTime?: number;
  groupId?: Id<"vaultGroups">;
};

/** Stable key for duplicate detection across collections (name + size). */
export function vaultDuplicateKey(file: Pick<VaultFileRow, "name" | "size">): string {
  return `${file.name.trim().toLowerCase()}::${file.size}`;
}

function groupByDuplicateKey(files: VaultFileRow[]): Map<string, VaultFileRow[]> {
  const byKey = new Map<string, VaultFileRow[]>();
  for (const file of files) {
    const key = vaultDuplicateKey(file);
    const list = byKey.get(key);
    if (list) {
      list.push(file);
    } else {
      byKey.set(key, [file]);
    }
  }
  return byKey;
}

/** Oldest upload in a duplicate set is treated as the original to keep. */
export function getCanonicalFileId(group: VaultFileRow[]): Id<"vaultFiles"> {
  const sorted = [...group].sort(
    (a, b) => (a._creationTime ?? 0) - (b._creationTime ?? 0)
  );
  return sorted[0]!._id;
}

/** Every file id that belongs to a duplicate set (2+ with the same key). */
export function getDuplicateVaultFileIds(files: VaultFileRow[]): Set<Id<"vaultFiles">> {
  const duplicateIds = new Set<Id<"vaultFiles">>();
  for (const group of groupByDuplicateKey(files).values()) {
    if (group.length > 1) {
      for (const file of group) {
        duplicateIds.add(file._id);
      }
    }
  }
  return duplicateIds;
}

/** Extra copies only — excludes the canonical original per duplicate set. */
export function getExtraDuplicateFileIds(files: VaultFileRow[]): Set<Id<"vaultFiles">> {
  const extras = new Set<Id<"vaultFiles">>();
  for (const group of groupByDuplicateKey(files).values()) {
    if (group.length <= 1) continue;
    const canonicalId = getCanonicalFileId(group);
    for (const file of group) {
      if (file._id !== canonicalId) {
        extras.add(file._id);
      }
    }
  }
  return extras;
}

export function countExtraDuplicateFiles(files: VaultFileRow[]): number {
  return getExtraDuplicateFileIds(files).size;
}

/** Canonical (oldest) file id per duplicate set — these are protected from deletion. */
export function getCanonicalFileIds(files: VaultFileRow[]): Set<Id<"vaultFiles">> {
  const ids = new Set<Id<"vaultFiles">>();
  for (const group of groupByDuplicateKey(files).values()) {
    if (group.length > 1) {
      ids.add(getCanonicalFileId(group));
    }
  }
  return ids;
}

export function countDuplicateSets(files: VaultFileRow[]): number {
  let count = 0;
  for (const group of groupByDuplicateKey(files).values()) {
    if (group.length > 1) count += 1;
  }
  return count;
}

/** @deprecated Prefer {@link countExtraDuplicateFiles} for UI counts. */
export function countDuplicateVaultFiles(files: VaultFileRow[]): number {
  return countExtraDuplicateFiles(files);
}

export type DuplicateOriginalInfo = {
  canonicalId: Id<"vaultFiles">;
  canonicalGroupId?: Id<"vaultGroups">;
};

/** Maps each extra copy to the original file kept in the vault. */
export function getOriginalInfoForExtras(
  files: VaultFileRow[]
): Map<Id<"vaultFiles">, DuplicateOriginalInfo> {
  const info = new Map<Id<"vaultFiles">, DuplicateOriginalInfo>();
  for (const group of groupByDuplicateKey(files).values()) {
    if (group.length <= 1) continue;
    const canonical = group.find((f) => f._id === getCanonicalFileId(group));
    if (!canonical) continue;
    const original: DuplicateOriginalInfo = {
      canonicalId: canonical._id,
      canonicalGroupId: canonical.groupId,
    };
    for (const file of group) {
      if (file._id !== canonical._id) {
        info.set(file._id, original);
      }
    }
  }
  return info;
}

/** Strip any canonical originals from a delete selection (safety net). */
export function filterIdsToExtraDuplicatesOnly(
  fileIds: Id<"vaultFiles">[],
  allFiles: VaultFileRow[]
): Id<"vaultFiles">[] {
  const extras = getExtraDuplicateFileIds(allFiles);
  return fileIds.filter((id) => extras.has(id));
}
