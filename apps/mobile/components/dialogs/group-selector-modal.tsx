import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
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
  const { colors } = useAppTheme();
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) ?? null;
  const showManage =
    groups.length > 0 && selectedGroup && onRenameGroup && onDeleteGroup;

  return (
    <Modal visible={visible} onClose={onClose} variant="center">
      <ScrollView
        className="max-h-[420px]"
        contentContainerClassName="pb-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={groups.length > 8}
      >
        <View className="p-1.5">
          {groups.length === 0 ? (
            <View className="items-center px-3 py-4">
              <Text className="text-center text-sm text-secondary-foreground">
                No groups found
              </Text>
              <Text className="mt-1 text-center text-xs text-secondary-foreground">
                Create a group to get started
              </Text>
            </View>
          ) : (
            groups.map((group, i) => {
              const isSelected = group._id === selectedGroupId;
              return (
                <Pressable
                  key={group._id}
                  className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
                  onPress={() => {
                    onSelectGroup(group._id);
                    onClose();
                  }}
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
                  {isSelected ? (
                    <Ionicons name="checkmark" size={18} color={colors.text} />
                  ) : (
                    <View className="w-[18px]" />
                  )}
                </Pressable>
              );
            })
          )}

          <View className="my-1 mx-1 h-px bg-border" />

          <Pressable
            className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
            onPress={onCreateGroup}
          >
            <View className="w-[18px] items-center">
              <Ionicons name="add" size={18} color={colors.text} />
            </View>
            <Text className="flex-1 text-sm font-medium text-foreground">Create Group</Text>
          </Pressable>

          {showManage && (
            <>
              <Pressable
                className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
                onPress={() => {
                  onRenameGroup();
                }}
              >
                <View className="w-[18px] items-center">
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-foreground">Rename</Text>
              </Pressable>
              <Pressable
                className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
                onPress={() => {
                  onDeleteGroup();
                }}
              >
                <View className="w-[18px] items-center">
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </View>
                <Text className="flex-1 text-sm font-medium text-destructive">Delete Group</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}
