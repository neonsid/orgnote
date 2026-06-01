import { Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { SheetBody, SheetRow, SheetSectionLabel } from "@/components/ui/sheet-row";
import { FALLBACK_COLORS } from "@goldfish/shared";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface VaultMoveFileGroupRow {
  _id: Id<"vaultGroups">;
  title: string;
  color?: string;
}

interface VaultMoveFileModalProps {
  visible: boolean;
  onClose: () => void;
  fileName: string;
  groups: VaultMoveFileGroupRow[];
  onSelectGroup: (groupId: Id<"vaultGroups">) => void;
}

export function VaultMoveFileModal({
  visible,
  onClose,
  fileName,
  groups,
  onSelectGroup,
}: VaultMoveFileModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      variant="bottom"
      title="Move file"
      subtitle={fileName ? `Move "${fileName}" to another collection` : "Choose a collection"}
      scrollable
      showHandle
    >
      {groups.length === 0 ? (
        <View className="items-center py-8">
          <Text className="font-sans text-sm font-medium text-foreground">No other collections</Text>
          <Text className="mt-1 text-center font-sans text-xs text-muted-foreground">
            Create another collection to move files.
          </Text>
        </View>
      ) : (
        <SheetBody>
          <SheetSectionLabel>Move to</SheetSectionLabel>
          {groups.map((group, i) => (
            <SheetRow
              key={group._id}
              title={group.title}
              dotColor={group.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              onPress={() => onSelectGroup(group._id)}
            />
          ))}
        </SheetBody>
      )}
    </Modal>
  );
}
