import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View, type ListRenderItemInfo } from "react-native";

import { Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import {
  vaultUploadPhaseLabel,
  type VaultUploadFileItem,
  type VaultUploadStatus,
} from "@/hooks/use-vault-upload";

function FileStatusIcon({ phase }: { phase: VaultUploadFileItem["phase"] }) {
  const { colors } = useAppTheme();

  if (phase === "done") {
    return <Ionicons name="checkmark-circle" size={22} color={colors.success} />;
  }
  if (phase === "error") {
    return <Ionicons name="close-circle" size={22} color={colors.error} />;
  }
  if (phase === "queued") {
    return <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />;
  }
  return <ActivityIndicator size="small" color={colors.primaryAccent} />;
}

function UploadFileRow({ file }: { file: VaultUploadFileItem }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-muted/50 px-3 py-3">
      <FileStatusIcon phase={file.phase} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-sans text-[15px] font-medium leading-5 text-foreground" numberOfLines={2}>
          {file.fileName}
        </Text>
        <Text className="font-sans text-sm text-muted-foreground">
          {vaultUploadPhaseLabel(file.phase)}
        </Text>
        {file.errorMessage ? (
          <Text className="font-sans text-xs leading-4 text-destructive" numberOfLines={2}>
            {file.errorMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function UploadProgressBar({ done, total }: { done: number; total: number }) {
  const { colors } = useAppTheme();
  const progress = total > 0 ? done / total : 0;

  return (
    <View className="gap-2">
      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.max(progress * 100, 8)}%`,
            backgroundColor: colors.primaryAccent,
          }}
        />
      </View>
      <Text className="font-sans text-sm text-muted-foreground">
        {done} of {total} complete
      </Text>
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
    <Modal
      visible
      onClose={() => {}}
      variant="center"
      compact={false}
      title="Uploading to vault"
      subtitle={
        activeCount > 0
          ? `${activeCount} file${activeCount === 1 ? "" : "s"} in progress`
          : "Preparing your files…"
      }
      dismissOnBackdrop={false}
      showCloseButton={false}
    >
      <View className="gap-4">
        <UploadProgressBar done={doneCount} total={status.files.length} />

        <FlatList
          data={status.files}
          keyExtractor={(file) => file.id}
          className="max-h-80"
          contentContainerClassName="gap-2"
          showsVerticalScrollIndicator={false}
          scrollEnabled={status.files.length > 4}
          renderItem={renderItem}
        />
      </View>
    </Modal>
  );
}
