import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View, type ListRenderItemInfo } from "react-native";

import { useAppTheme } from "@/contexts/app-theme";
import {
  vaultUploadPhaseLabel,
  type VaultUploadFileItem,
  type VaultUploadStatus,
} from "@/hooks/use-vault-upload";

function FileStatusIcon({ phase }: { phase: VaultUploadFileItem["phase"] }) {
  const { colors } = useAppTheme();

  if (phase === "done") {
    return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
  }
  if (phase === "error") {
    return <Ionicons name="close-circle" size={20} color={colors.error} />;
  }
  if (phase === "queued") {
    return <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />;
  }
  return <ActivityIndicator size="small" color={colors.primary} />;
}

function UploadFileRow({ file }: { file: VaultUploadFileItem }) {
  return (
    <View className="flex-row items-center gap-2 border-b border-border py-2">
      <FileStatusIcon phase={file.phase} />
      <View className="flex-1 gap-0.5">
        <Text className="text-[13px] font-medium text-foreground" numberOfLines={2}>
          {file.fileName}
        </Text>
        <Text className="text-xs text-secondary-foreground">
          {vaultUploadPhaseLabel(file.phase)}
        </Text>
        {file.errorMessage ? (
          <Text className="text-[11px] text-destructive" numberOfLines={2}>
            {file.errorMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function UploadProgressOverlay({ status }: { status: VaultUploadStatus }) {
  const doneCount = status.files.filter((f) => f.phase === "done").length;
  const activeCount = status.files.filter(
    (f) => f.phase !== "done" && f.phase !== "error" && f.phase !== "queued"
  ).length;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VaultUploadFileItem>) => <UploadFileRow file={item} />,
    []
  );

  return (
    <View
      className="absolute inset-0 items-center justify-center bg-overlay p-4"
      pointerEvents="auto"
    >
      <View className="max-h-[80%] w-full max-w-[360px] gap-2 rounded-lg border border-border bg-surface p-4">
        <Text className="text-center text-lg font-bold text-foreground">Uploading to vault</Text>
        <Text className="mb-1 text-center text-[13px] text-muted-foreground">
          {doneCount}/{status.files.length} complete
          {activeCount > 0 ? ` · ${activeCount} in progress` : ""}
        </Text>
        <FlatList
          data={status.files}
          keyExtractor={(file) => file.id}
          className="max-h-80"
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
        />
      </View>
    </View>
  );
}
