import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Share, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BookmarkData } from "@/components/dashboard/bookmark-card";
import { AppPressable } from "@/components/ui/app-pressable";
import { useAppTheme } from "@/contexts/app-theme";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { showThemedAlert } from "@/contexts/themed-alert";
import {
  generateCSVExport,
  generateJSONExport,
  toExportedBookmark,
} from "@/lib/bookmark-export";
import { cn } from "@/lib/cn";
import { FALLBACK_COLORS } from "@goldfish/shared";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  title: string;
  color?: string;
}

interface MultiSelectToolbarProps {
  selectedCount: number;
  selectedIds: Id<"bookmarks">[];
  selectedBookmarks: BookmarkData[];
  groupTitle: string;
  groups: Group[];
  currentGroupId: Id<"groups"> | null;
  allVisibleSelected: boolean;
  onClearSelection: () => void;
  onToggleSelectAllVisible: () => void;
}

type ExpandedPanel = "move" | "export" | null;

function ToolbarButton({
  icon,
  label,
  onPress,
  destructive = false,
  disabled = false,
  active = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  active?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <AppPressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "flex-row items-center gap-1.5 rounded-full px-3 py-2 active:bg-accent",
        active && "bg-accent",
        disabled && "opacity-40"
      )}
    >
      <Ionicons
        name={icon}
        size={16}
        color={destructive ? colors.error : colors.textSecondary}
      />
      <Text
        className={cn(
          "font-sans text-sm font-medium",
          destructive ? "text-destructive" : "text-foreground"
        )}
      >
        {label}
      </Text>
    </AppPressable>
  );
}

export function MultiSelectToolbar({
  selectedCount,
  selectedIds,
  selectedBookmarks,
  groupTitle,
  groups,
  currentGroupId,
  allVisibleSelected,
  onClearSelection,
  onToggleSelectAllVisible,
}: MultiSelectToolbarProps) {
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const deleteBookmarksBulk = useMutation(api.bookmarks.mutations.deleteBookmarksBulk);
  const moveBookmarksBulk = useMutation(api.bookmarks.mutations.moveBookmarksBulk);
  const tabBarHeight = useTabBarHeight();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors } = useAppTheme();

  const moveTargets = groups.filter((g) => g._id !== currentGroupId);
  const movePanelMaxHeight = Math.min(240, Math.floor(screenHeight * 0.3));

  function togglePanel(panel: ExpandedPanel) {
    setExpandedPanel((current) => (current === panel ? null : panel));
  }

  function handleBulkDelete() {
    if (selectedCount === 0) return;

    showThemedAlert(
      "Delete bookmarks",
      `Delete ${selectedCount} bookmark${selectedCount > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBookmarksBulk({ bookmarkIds: selectedIds });
              onClearSelection();
            } catch {
              showThemedAlert("Error", "Failed to delete bookmarks");
            }
          },
        },
      ]
    );
  }

  async function handleBulkMove(targetGroupId: Id<"groups">) {
    try {
      await moveBookmarksBulk({ bookmarkIds: selectedIds, groupId: targetGroupId });
      setExpandedPanel(null);
      onClearSelection();
    } catch {
      showThemedAlert("Error", "Failed to move bookmarks");
    }
  }

  async function handleCopyUrls() {
    try {
      const text = selectedBookmarks.map((b) => b.url).join("\n");
      await Clipboard.setStringAsync(text);
      showThemedAlert(
        "Copied",
        `${selectedCount} URL${selectedCount > 1 ? "s" : ""} copied to the clipboard.`
      );
    } catch {
      showThemedAlert("Error", "Could not copy to clipboard");
    }
  }

  async function shareExport(format: "csv" | "json") {
    const exported = selectedBookmarks.map((b) =>
      toExportedBookmark({
        title: b.title,
        url: b.url,
        groupName: groupTitle,
        createdAtIso: new Date(b._creationTime ?? Date.now()).toISOString(),
      })
    );
    const body =
      format === "csv" ? generateCSVExport(exported) : generateJSONExport(exported);
    const ext = format === "csv" ? "csv" : "json";
    try {
      await Share.share({
        title: `OrgNote bookmarks.${ext}`,
        message: body,
      });
      setExpandedPanel(null);
    } catch {
      showThemedAlert("Error", "Could not open share sheet");
    }
  }

  return (
    <View
      className="absolute left-0 right-0 items-center px-3"
      pointerEvents="box-none"
      style={{
        bottom: tabBarHeight + Math.max(insets.bottom, 8),
        zIndex: 90,
        elevation: 20,
      }}
    >
      <View className="w-full max-w-[680px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
        <View className="flex-row flex-wrap items-center justify-center gap-0.5 px-1.5 py-1.5">
          <ToolbarButton
            icon={allVisibleSelected ? "checkbox" : "checkbox-outline"}
            label={allVisibleSelected ? "Clear all" : "Select all"}
            onPress={onToggleSelectAllVisible}
          />

          <View className="mx-0.5 h-5 w-px bg-border" />

          <ToolbarButton
            icon="arrow-forward-outline"
            label="Move"
            onPress={() => togglePanel("move")}
            active={expandedPanel === "move"}
            disabled={moveTargets.length === 0 || selectedCount === 0}
          />
          <ToolbarButton icon="copy-outline" label="Copy URLs" onPress={() => void handleCopyUrls()} />
          <ToolbarButton
            icon="share-outline"
            label="Export"
            onPress={() => togglePanel("export")}
            active={expandedPanel === "export"}
            disabled={selectedCount === 0}
          />
          <ToolbarButton
            icon="trash-outline"
            label="Delete"
            onPress={handleBulkDelete}
            destructive
            disabled={selectedCount === 0}
          />

          <View className="mx-0.5 h-5 w-px bg-border" />

          <AppPressable
            onPress={onClearSelection}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-accent"
            accessibilityLabel="Exit selection mode"
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </AppPressable>
        </View>

        {expandedPanel === "move" ? (
          <ScrollView
            style={{ maxHeight: movePanelMaxHeight }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            className="border-t border-border px-2 py-1.5"
          >
            {moveTargets.map((group, i) => (
              <AppPressable
                key={group._id}
                onPress={() => void handleBulkMove(group._id)}
                className="flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-accent"
              >
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: group.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                />
                <Text className="min-w-0 flex-1 font-sans text-base text-foreground" numberOfLines={1}>
                  {group.title}
                </Text>
              </AppPressable>
            ))}
          </ScrollView>
        ) : null}

        {expandedPanel === "export" ? (
          <View className="border-t border-border px-2 py-1.5">
            <AppPressable
              onPress={() => void shareExport("csv")}
              className="flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-accent"
            >
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <Text className="font-sans text-base text-foreground">Export as CSV</Text>
            </AppPressable>
            <AppPressable
              onPress={() => void shareExport("json")}
              className="flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-accent"
            >
              <Ionicons name="code-slash-outline" size={18} color={colors.textSecondary} />
              <Text className="font-sans text-base text-foreground">Export as JSON</Text>
            </AppPressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}
