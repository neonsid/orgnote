import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { borderRadius, spacing } from "@/lib/constants";
import { getHostname } from "@/lib/utils";
import type { Id } from "../../../../convex/_generated/dataModel";

export interface BookmarkData {
  _id: Id<"bookmarks">;
  title: string;
  url: string;
  doneReading?: boolean;
  description?: string;
  /** Convex `_creationTime` (ms); used for export parity with web. */
  _creationTime?: number;
}

interface BookmarkCardProps {
  bookmark: BookmarkData;
  onPress: () => void;
  onLongPress: () => void;
  onToggleRead?: (bookmark: BookmarkData) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
}

export function BookmarkCard({
  bookmark,
  onPress,
  onLongPress,
  onToggleRead,
  isSelecting = false,
  isSelected = false,
}: BookmarkCardProps) {
  const { colors } = useAppTheme();
  const hostname = getHostname(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          gap: spacing.md,
          borderRadius: borderRadius.md,
          borderWidth: 2,
          borderColor: "transparent",
        },
        rowPressed: {
          backgroundColor: colors.muted,
        },
        rowSelected: {
          backgroundColor: colors.selectionMuted,
          borderColor: colors.selection,
        },
        faviconContainer: {
          width: 26,
          height: 26,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          marginTop: 1,
        },
        favicon: {
          width: 22,
          height: 22,
        },
        checkboxContainer: {
          width: 22,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        checkboxSelected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        content: {
          flex: 1,
          minWidth: 0,
          gap: 4,
        },
        title: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        titleRead: {
          color: colors.textMuted,
          fontWeight: "500",
        },
        domain: {
          fontSize: 13,
          color: colors.textMuted,
        },
        description: {
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 16,
        },
        trailing: {
          marginLeft: spacing.xs,
          paddingTop: 2,
        },
        readToggle: {
          width: 28,
          height: 28,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors]
  );

  function handleToggleRead(event: GestureResponderEvent) {
    event.stopPropagation();
    onToggleRead?.(bookmark);
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && !isSelected && styles.rowPressed,
        isSelected && styles.rowSelected,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {isSelecting ? (
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color={colors.surface} />}
          </View>
        </View>
      ) : (
        <View style={styles.faviconContainer}>
          <Image source={{ uri: faviconUrl }} style={styles.favicon} />
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={[styles.title, bookmark.doneReading && styles.titleRead]}
          numberOfLines={2}
        >
          {bookmark.title || "Untitled"}
        </Text>
        <Text style={styles.domain} numberOfLines={1}>
          {hostname}
        </Text>
        {bookmark.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {bookmark.description}
          </Text>
        ) : null}
      </View>

      {!isSelecting && onToggleRead && (
        <View style={styles.trailing}>
          <Pressable onPress={handleToggleRead} hitSlop={6} style={styles.readToggle}>
            <Ionicons
              name={bookmark.doneReading ? "checkmark-circle" : "checkmark-circle-outline"}
              size={20}
              color={bookmark.doneReading ? colors.success : colors.textMuted}
            />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
