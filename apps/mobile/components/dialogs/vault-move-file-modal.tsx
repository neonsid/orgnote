import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import type { AppColors } from "@/lib/theme-colors";
import { spacing, borderRadius } from "@/lib/constants";
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} onClose={onClose} title="Move to collection" variant="center">
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
                No other collections
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Create another vault collection to move files between them.
              </Text>
            </View>
          ) : (
            groups.map((group, i) => (
              <Pressable
                key={group._id}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => onSelectGroup(group._id)}
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
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    subtitle: {
      fontSize: 13,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    scroll: {
      maxHeight: 360,
    },
    scrollContent: {
      paddingBottom: spacing.md,
    },
    inner: {
      paddingHorizontal: spacing.sm,
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
      minHeight: 44,
      paddingVertical: 10,
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
  });
}
