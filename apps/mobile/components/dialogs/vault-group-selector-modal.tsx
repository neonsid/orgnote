import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
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
  const { colors } = useAppTheme();
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) ?? null;
  const showManage =
    groups.length > 0 && selectedGroup && onRenameGroup && onDeleteGroup;
  const hasDuplicates = duplicateSetCount > 0;

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

          <View className="mx-1 my-1 h-px bg-border" />

          <Pressable
            className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
            onPress={onCreateGroup}
          >
            <View className="w-[18px] items-center">
              <Ionicons name="add" size={18} color={colors.text} />
            </View>
            <Text className="flex-1 text-sm font-medium text-foreground">Create Group</Text>
          </Pressable>

          {onShowDuplicates ? (
            <Pressable
              className={cn(
                "min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted",
                !hasDuplicates && "opacity-70"
              )}
              onPress={onShowDuplicates}
            >
              <View className="w-[18px] items-center">
                <Ionicons
                  name={viewingDuplicates ? "copy" : "copy-outline"}
                  size={18}
                  color={viewingDuplicates ? colors.primaryAccent : colors.textSecondary}
                />
              </View>
              <Text
                className={cn(
                  "flex-1 text-sm font-medium",
                  viewingDuplicates ? "text-primary-accent" : "text-foreground"
                )}
              >
                {viewingDuplicates
                  ? "Viewing duplicates"
                  : hasDuplicates
                    ? `Duplicates (${duplicateSetCount} sets)`
                    : "Duplicates"}
              </Text>
              {viewingDuplicates ? (
                <Ionicons name="checkmark" size={18} color={colors.primaryAccent} />
              ) : (
                <View className="w-[18px]" />
              )}
            </Pressable>
          ) : null}

          {showManage && (
            <>
              <Pressable
                className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
                onPress={onRenameGroup}
              >
                <View className="w-[18px] items-center">
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </View>
                <Text className="flex-1 text-sm font-medium text-foreground">Rename</Text>
              </Pressable>
              <Pressable
                className="min-h-10 flex-row items-center gap-2.5 rounded-md px-3 py-2 active:bg-muted"
                onPress={onDeleteGroup}
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
