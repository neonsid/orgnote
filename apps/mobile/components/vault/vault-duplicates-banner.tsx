import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { cn } from "@/lib/cn";
import {
  countExtraDuplicateFiles,
  getExtraDuplicateFileIds,
  type VaultFileRow,
} from "@/lib/vault-duplicates";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function VaultDuplicatesBanner({
  allFiles,
  statsLabel,
  onToggleDuplicatesView,
  onDuplicatesCleared,
}: {
  allFiles: VaultFileRow[];
  statsLabel: string;
  onToggleDuplicatesView: () => void;
  onDuplicatesCleared: () => void;
}) {
  const { colors } = useAppTheme();
  const deleteVaultFilesBulk = useMutation(api.vault.mutations.deleteVaultFilesBulk);
  const extraCount = countExtraDuplicateFiles(allFiles);

  function handleRemoveAllExtras() {
    const extraIds = [...getExtraDuplicateFileIds(allFiles)] as Id<"vaultFiles">[];
    if (extraIds.length === 0) return;

    showThemedAlert(
      "Remove all duplicate copies",
      `Remove ${extraIds.length} extra cop${extraIds.length === 1 ? "y" : "ies"}? Originals stay in your collections.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove all",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVaultFilesBulk({ fileIds: extraIds });
              onDuplicatesCleared();
            } catch {
              showThemedAlert("Error", "Failed to remove duplicate copies");
            }
          },
        },
      ]
    );
  }

  return (
    <View className="gap-3 border-b border-border bg-surface px-4 py-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-xs text-muted-foreground">{statsLabel}</Text>
        <Pressable
          className={cn(
            "flex-row items-center gap-1 rounded-sm border border-primary-accent bg-primary-accent/10 px-2 py-1",
            "active:bg-muted"
          )}
          onPress={onToggleDuplicatesView}
          accessibilityLabel="Show collection files"
        >
          <Ionicons name="copy" size={14} color={colors.primaryAccent} />
          <Text className="text-[11px] font-semibold text-primary-accent">Back to collections</Text>
        </Pressable>
      </View>
      {extraCount > 0 ? (
        <Button variant="destructive" onPress={handleRemoveAllExtras}>
          <Button.Text>Remove all {extraCount} duplicate cop{extraCount === 1 ? "y" : "ies"}</Button.Text>
        </Button>
      ) : null}
    </View>
  );
}
