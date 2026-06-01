import { Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { SheetBody, SheetDivider, SheetRow, SheetSectionLabel } from "@/components/ui/sheet-row";
import { FALLBACK_COLORS } from "@goldfish/shared";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

interface GroupSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  groups: Group[];
  selectedGroupId: Id<"groups"> | null;
  onSelectGroup: (id: Id<"groups">) => void;
  onCreateGroup: () => void;
  onRenameGroup?: () => void;
  onDeleteGroup?: () => void;
}

export function GroupSelectorModal({
  visible,
  onClose,
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
}: GroupSelectorModalProps) {
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) ?? null;
  const showManage =
    groups.length > 0 && selectedGroup && onRenameGroup && onDeleteGroup;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="bottom"
      title="Collections"
      subtitle="Switch or manage your bookmark collections"
      scrollable
      showHandle
    >
      {groups.length === 0 ? (
        <View className="items-center py-8">
          <Text className="font-sans text-base font-medium text-foreground">No collections yet</Text>
          <Text className="mt-1 text-center font-sans text-sm text-muted-foreground">
            Create one to start saving bookmarks.
          </Text>
        </View>
      ) : (
        <SheetBody>
          <SheetSectionLabel>Your collections</SheetSectionLabel>
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

      <SheetBody>
        <SheetDivider />
        <SheetSectionLabel>Actions</SheetSectionLabel>
        <SheetRow title="Create collection" icon="add-circle-outline" onPress={onCreateGroup} showChevron />
        {showManage ? (
          <>
            <SheetRow title="Rename collection" icon="pencil-outline" onPress={onRenameGroup} showChevron />
            <SheetRow
              title="Delete collection"
              icon="trash-outline"
              destructive
              onPress={onDeleteGroup}
              showChevron
            />
          </>
        ) : null}
      </SheetBody>
    </Modal>
  );
}
