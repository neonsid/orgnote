import { useCallback } from "react";
import { FlatList, type ListRenderItemInfo } from "react-native";

import { FileTile } from "@/components/vault/file-tile";
import type { DuplicateOriginalInfo } from "@/lib/vault-duplicates";
import type { Id } from "../../../../convex/_generated/dataModel";

export type VaultListFile = {
  _id: Id<"vaultFiles">;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  groupId?: Id<"vaultGroups">;
  ownerId?: string;
  _creationTime?: number;
};

interface VaultFileListProps {
  files: VaultListFile[];
  viewingDuplicates: boolean;
  isSelecting: boolean;
  canonicalFileIds: Set<Id<"vaultFiles">>;
  originalInfoForExtras: Map<Id<"vaultFiles">, DuplicateOriginalInfo>;
  groupTitleById: Map<Id<"vaultGroups">, string>;
  isSelected: (id: Id<"vaultFiles">) => boolean;
  onFilePress: (fileId: Id<"vaultFiles">) => void;
  onFileLongPress: (fileId: Id<"vaultFiles">) => void;
}

function VaultFileListItem({
  file,
  viewingDuplicates,
  isSelecting,
  canonicalFileIds,
  originalInfoForExtras,
  groupTitleById,
  selected,
  onFilePress,
  onFileLongPress,
}: {
  file: VaultListFile;
  viewingDuplicates: boolean;
  isSelecting: boolean;
  canonicalFileIds: Set<Id<"vaultFiles">>;
  originalInfoForExtras: Map<Id<"vaultFiles">, DuplicateOriginalInfo>;
  groupTitleById: Map<Id<"vaultGroups">, string>;
  selected: boolean;
  onFilePress: (fileId: Id<"vaultFiles">) => void;
  onFileLongPress: (fileId: Id<"vaultFiles">) => void;
}) {
  const isOriginal = viewingDuplicates && canonicalFileIds.has(file._id);
  const originalInfo = originalInfoForExtras.get(file._id);
  const originalGroupTitle =
    originalInfo?.canonicalGroupId != null
      ? groupTitleById.get(originalInfo.canonicalGroupId) ?? "Unknown"
      : undefined;

  return (
    <FileTile
      file={file}
      isSelecting={isSelecting}
      selected={selected}
      isOriginal={isOriginal}
      selectionLocked={isOriginal}
      groupLabel={
        viewingDuplicates && file.groupId
          ? groupTitleById.get(file.groupId) ?? "Unknown"
          : undefined
      }
      originalLocationLabel={viewingDuplicates && !isOriginal ? originalGroupTitle : undefined}
      onPress={onFilePress}
      onLongPress={onFileLongPress}
    />
  );
}

export function VaultFileList({
  files,
  viewingDuplicates,
  isSelecting,
  canonicalFileIds,
  originalInfoForExtras,
  groupTitleById,
  isSelected,
  onFilePress,
  onFileLongPress,
}: VaultFileListProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VaultListFile>) => (
      <VaultFileListItem
        file={item}
        viewingDuplicates={viewingDuplicates}
        isSelecting={isSelecting}
        canonicalFileIds={canonicalFileIds}
        originalInfoForExtras={originalInfoForExtras}
        groupTitleById={groupTitleById}
        selected={isSelected(item._id)}
        onFilePress={onFilePress}
        onFileLongPress={onFileLongPress}
      />
    ),
    [
      viewingDuplicates,
      isSelecting,
      canonicalFileIds,
      originalInfoForExtras,
      groupTitleById,
      isSelected,
      onFilePress,
      onFileLongPress,
    ]
  );

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperClassName="justify-between"
      contentContainerClassName="p-3 pb-32"
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
    />
  );
}
