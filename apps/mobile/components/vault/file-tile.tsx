import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import { promptOpenExternalUrl } from "@/lib/open-external-url";
import { spacing, borderRadius } from "@/lib/constants";
import type { AppColors } from "@/lib/theme-colors";
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
  onLongPress: () => void;
}

function getFileIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.startsWith("image/")) return "image-outline";
  if (type.startsWith("video/")) return "videocam-outline";
  if (type.startsWith("audio/")) return "musical-notes-outline";
  if (type.includes("pdf")) return "document-text-outline";
  if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
    return "archive-outline";
  return "document-outline";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function makeFileTileStyles(colors: AppColors) {
  return StyleSheet.create({
    tile: {
      width: "48%",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      overflow: "hidden",
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tilePressed: {
      opacity: 0.85,
    },
    preview: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: colors.muted,
    },
    iconContainer: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      padding: spacing.sm,
    },
    name: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
    size: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}

export function FileTile({ file, onLongPress }: FileTileProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeFileTileStyles(colors), [colors]);
  const isImage = file.type.startsWith("image/");
  const previewUrl = file.thumbnailUrl ?? (isImage ? file.url : undefined);

  function handlePress() {
    void promptOpenExternalUrl(file.url, file.name);
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={handlePress}
      onLongPress={onLongPress}
    >
      {previewUrl ? (
        <Image source={{ uri: previewUrl }} style={styles.preview} />
      ) : (
        <View style={styles.iconContainer}>
          <Ionicons name={getFileIcon(file.type)} size={32} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={styles.size}>{formatFileSize(file.size)}</Text>
      </View>
    </Pressable>
  );
}
