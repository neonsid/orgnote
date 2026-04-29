import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import type { AppColors } from "@/lib/theme-colors";
import { spacing, borderRadius } from "@/lib/constants";
import type { Id } from "../../../../convex/_generated/dataModel";

/** Matches `apps/web/components/dashboard/group-selector.tsx` (vault uses same list pattern). */
const FALLBACK_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

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
}: VaultGroupSelectorModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) ?? null;
  const showManage =
    groups.length > 0 && selectedGroup && onRenameGroup && onDeleteGroup;

  return (
    <Modal visible={visible} onClose={onClose} variant="center">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={groups.length > 8}
      >
        <View style={styles.inner}>
          {groups.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No groups found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Create a group to get started
              </Text>
            </View>
          ) : (
            groups.map((group, i) => {
              const isSelected = group._id === selectedGroupId;
              return (
                <Pressable
                  key={group._id}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => {
                    onSelectGroup(group._id);
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor:
                          group.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                      },
                    ]}
                  />
                  <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
                    {group.title}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={18} color={colors.text} />
                  ) : (
                    <View style={styles.checkSpacer} />
                  )}
                </Pressable>
              );
            })
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={onCreateGroup}
          >
            <Ionicons name="add" size={18} color={colors.text} style={styles.leadingIcon} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Create Group</Text>
          </Pressable>

          {showManage && (
            <>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  onRenameGroup();
                }}
              >
                <Ionicons
                  name="pencil"
                  size={18}
                  color={colors.textSecondary}
                  style={styles.leadingIcon}
                />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Rename</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  onDeleteGroup();
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.error}
                  style={styles.leadingIcon}
                />
                <Text style={[styles.rowLabel, { color: colors.error }]}>Delete Group</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

function makeStyles(colors: AppColors) {
  const pad = 6;
  return StyleSheet.create({
    scroll: {
      maxHeight: 420,
    },
    scrollContent: {
      paddingBottom: spacing.md,
    },
    inner: {
      padding: pad,
    },
    empty: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 14,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 12,
      textAlign: "center",
      marginTop: spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 40,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: borderRadius.md,
    },
    rowPressed: {
      backgroundColor: colors.muted,
    },
    rowLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    leadingIcon: {
      width: 18,
      alignItems: "center",
    },
    checkSpacer: {
      width: 18,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: 4,
      marginHorizontal: 4,
    },
  });
}
