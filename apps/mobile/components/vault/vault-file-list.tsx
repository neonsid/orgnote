import { FlatList, View } from "react-native";

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
  onFilePress: (file: VaultListFile) => void;
  onFileLongPress: (file: VaultListFile) => void;
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
  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperClassName="justify-between"
      contentContainerClassName="p-3 pb-32"
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isOriginal = viewingDuplicates && canonicalFileIds.has(item._id);
        const originalInfo = originalInfoForExtras.get(item._id);
        const originalGroupTitle =
          originalInfo?.canonicalGroupId != null
            ? groupTitleById.get(originalInfo.canonicalGroupId) ?? "Unknown"
            : undefined;

        return (
          <FileTile
            file={item}
            isSelecting={isSelecting}
            selected={isSelected(item._id)}
            isOriginal={isOriginal}
            selectionLocked={isOriginal}
            groupLabel={
              viewingDuplicates && item.groupId
                ? groupTitleById.get(item.groupId) ?? "Unknown"
                : undefined
            }
            originalLocationLabel={
              viewingDuplicates && !isOriginal ? originalGroupTitle : undefined
            }
            onPress={() => onFilePress(item)}
            onLongPress={() => onFileLongPress(item)}
          />
        );
      }}
    />
  );
}
