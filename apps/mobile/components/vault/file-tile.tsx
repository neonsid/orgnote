import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { cn } from "@/lib/cn";
import type { Id } from "../../../../convex/_generated/dataModel";

interface FileData {
  _id: Id<"vaultFiles">;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

interface FileTileProps {
  file: FileData;
  onPress: (fileId: Id<"vaultFiles">) => void;
  onLongPress: (fileId: Id<"vaultFiles">) => void;
  isSelecting?: boolean;
  selected?: boolean;
  groupLabel?: string;
  isOriginal?: boolean;
  originalLocationLabel?: string;
  selectionLocked?: boolean;
}

function getFileIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.startsWith("image/")) return "image-outline";
  if (type.startsWith("video/")) return "videocam-outline";
  if (type.startsWith("audio/")) return "musical-notes-outline";
  if (type.includes("pdf")) return "document-text-outline";
  if (type.includes("epub")) return "book-outline";
  if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
    return "archive-outline";
  return "document-outline";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FileTile = memo(function FileTile({
  file,
  onPress,
  onLongPress,
  isSelecting = false,
  selected = false,
  groupLabel,
  isOriginal = false,
  originalLocationLabel,
  selectionLocked = false,
}: FileTileProps) {
  const { colors } = useAppTheme();
  const handlePress = useCallback(() => onPress(file._id), [onPress, file._id]);
  const handleLongPress = useCallback(() => onLongPress(file._id), [onLongPress, file._id]);
  const isImage = file.type.startsWith("image/");
  const previewUrl = file.thumbnailUrl ?? (isImage ? file.url : undefined);
  const showSelectionUi = isSelecting && !selectionLocked;

  const preview = previewUrl ? (
    <Image source={{ uri: previewUrl }} className="aspect-square w-full bg-muted" />
  ) : (
    <View className="relative aspect-square w-full items-center justify-center overflow-hidden bg-muted">
      <Ionicons name={getFileIcon(file.type)} size={36} color={colors.textSecondary} />
    </View>
  );

  return (
    <Pressable
      className={cn(
        "mb-3 w-[48%] rounded-xl border bg-surface",
        selected ? "border-2 border-primary-accent" : "border-border"
      )}
      style={({ pressed }) => [
        pressed && !selectionLocked ? { opacity: 0.92, transform: [{ scale: 0.98 }] } : undefined,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={selectionLocked && isSelecting}
      android_ripple={
        Platform.OS === "android" && !selectionLocked
          ? { color: `${colors.primaryAccent}22`, foreground: true }
          : undefined
      }
    >
      <View className="relative">
        {preview}
        {selectionLocked ? (
          <View className="absolute inset-0 bg-black/5" pointerEvents="none" />
        ) : null}
        {showSelectionUi ? (
          <>
            <View
              className="absolute inset-0"
              style={{
                backgroundColor: selected
                  ? `${colors.primaryAccent}22`
                  : `${colors.primaryAccent}33`,
              }}
              pointerEvents="none"
            />
            <View className="absolute left-2 top-2" pointerEvents="none">
              <View
                className={cn(
                  "h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white",
                  selected ? "border-primary-accent bg-primary-accent" : "bg-black/35"
                )}
              >
                {selected ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
              </View>
            </View>
          </>
        ) : null}
      </View>
      <View className="gap-0.5 p-2">
        <Text className="text-[13px] font-semibold tracking-wide text-foreground" numberOfLines={2}>
          {file.name}
        </Text>
        <Text className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</Text>
        {groupLabel ? (
          <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
            {groupLabel}
          </Text>
        ) : null}
        {isOriginal ? (
          <View className="mt-1 flex-row items-center gap-1 self-start rounded-sm bg-success/10 px-1.5 py-0.5">
            <Ionicons name="shield-checkmark-outline" size={11} color={colors.success} />
            <Text className="text-[10px] font-semibold text-success" numberOfLines={1}>
              Original · kept
            </Text>
          </View>
        ) : null}
        {originalLocationLabel ? (
          <View className="mt-1 flex-row items-center gap-1 self-start rounded-sm bg-primary-accent/10 px-1.5 py-0.5">
            <Ionicons name="copy-outline" size={11} color={colors.primaryAccent} />
            <Text className="text-[10px] font-semibold text-primary-accent" numberOfLines={1}>
              Copy · original in {originalLocationLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
