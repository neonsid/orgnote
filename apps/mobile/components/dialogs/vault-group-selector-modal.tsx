import { Text, View } from "react-native";

import { Modal } from "@/components/ui";
import {
  MenuGroup,
  MenuItem,
  MenuSeparator,
} from "@/components/ui/menu-item";
import { SheetBody, SheetRow, SheetSectionLabel } from "@/components/ui/sheet-row";
import { FALLBACK_COLORS } from "@goldfish/shared";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface VaultGroupRow {
  _id: Id<"vaultGroups">;
  title: string;
  color?: string;
}

interface VaultGroupSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  groups: VaultGroupRow[];
  selectedGroupId: Id<"vaultGroups"> | null;
  onSelectGroup: (id: Id<"vaultGroups">) => void;
  onCreateGroup: () => void;
  onRenameGroup?: () => void;
  onDeleteGroup?: () => void;
  duplicateSetCount?: number;
  viewingDuplicates?: boolean;
  onShowDuplicates?: () => void;
}

export function VaultGroupSelectorModal({
  visible,
  onClose,
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  duplicateSetCount = 0,
  viewingDuplicates = false,
  onShowDuplicates,
}: VaultGroupSelectorModalProps) {
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) ?? null;
  const showManage =
    groups.length > 0 && selectedGroup && onRenameGroup && onDeleteGroup;
  const hasDuplicates = duplicateSetCount > 0;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="bottom"
      title="Collections"
      subtitle="Switch or manage your vault collections"
      scrollable
      showHandle
    >
      {groups.length === 0 ? (
        <View className="items-center py-8">
          <Text className="font-sans text-sm font-medium text-foreground">No collections yet</Text>
          <Text className="mt-1 text-center font-sans text-xs text-muted-foreground">
            Create one to start uploading files.
          </Text>
        </View>
      ) : (
        <SheetBody>
          <SheetSectionLabel>Collections</SheetSectionLabel>
          {groups.map((group, i) => (
            <SheetRow
              key={group._id}
              title={group.title}
              dotColor={group.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              selected={group._id === selectedGroupId}
              onPress={() => {
                onSelectGroup(group._id);
                onClose();
              }}
            />
          ))}
        </SheetBody>
      )}

      <MenuGroup>
        <MenuSeparator />
        <MenuItem icon="add-circle-outline" label="Create collection" onPress={onCreateGroup} />

        {onShowDuplicates ? (
          <MenuItem
            icon={viewingDuplicates ? "copy" : "copy-outline"}
            label={
              viewingDuplicates
                ? "Viewing duplicates"
                : hasDuplicates
                  ? `Duplicates (${duplicateSetCount})`
                  : "Duplicates"
            }
            onPress={() => {
              onShowDuplicates();
              onClose();
            }}
            disabled={!hasDuplicates && !viewingDuplicates}
          />
        ) : null}

        {showManage ? (
          <>
            <MenuItem icon="pencil-outline" label="Rename" onPress={onRenameGroup} />
            <MenuItem icon="trash-outline" label="Delete" onPress={onDeleteGroup} destructive />
          </>
        ) : null}
      </MenuGroup>
    </Modal>
  );
}
