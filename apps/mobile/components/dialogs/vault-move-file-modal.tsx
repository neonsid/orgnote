import { Pressable, ScrollView, Text, View } from "react-native";

import { Modal } from "@/components/ui";
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
    <Modal visible={visible} onClose={onClose} title="Move to collection" variant="center">
      <ScrollView
        className="max-h-[360px]"
        contentContainerClassName="pb-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={groups.length > 8}
      >
        <View className="px-2">
          {groups.length === 0 ? (
            <View className="items-center px-3 py-4">
              <Text className="text-center text-sm text-secondary-foreground">
                No other collections
              </Text>
              <Text className="mt-1 text-center text-xs text-secondary-foreground">
                Create another vault collection to move files between them.
              </Text>
            </View>
          ) : (
            groups.map((group, i) => (
              <Pressable
                key={group._id}
                className="min-h-11 flex-row items-center gap-2.5 rounded-md px-3 py-2.5 active:bg-muted"
                onPress={() => onSelectGroup(group._id)}
              >
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      group.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                  }}
                />
                <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                  {group.title}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}
