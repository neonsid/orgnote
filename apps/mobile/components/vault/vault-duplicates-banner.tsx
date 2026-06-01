import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation } from "convex/react";
import { useState } from "react";
import { InteractionManager, Text, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { Button } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { cn } from "@/lib/cn";
import { deleteVaultFilesInBatches, getErrorMessage } from "@/lib/vault-bulk-delete";
import {
  countExtraDuplicateFiles,
  getExtraDuplicateFileIds,
  type VaultFileRow,
} from "@/lib/vault-duplicates";
import { api } from "../../../../convex/_generated/api";

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
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const [removing, setRemoving] = useState(false);
  const deleteVaultFilesBulk = useMutation(api.vault.mutations.deleteVaultFilesBulk);
  const extraCount = countExtraDuplicateFiles(allFiles);

  function handleRemoveAllExtras() {
    if (removing) return;

    if (isSignedIn !== true || !isAuthenticated) {
      showThemedAlert(
        "Sign in required",
        "Your session expired. Sign in again and retry removing duplicates."
      );
      return;
    }

    const extraIds = [...getExtraDuplicateFileIds(allFiles)];
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
            setRemoving(true);
            try {
              await deleteVaultFilesInBatches(deleteVaultFilesBulk, extraIds);
              onDuplicatesCleared();
            } catch (err) {
              InteractionManager.runAfterInteractions(() => {
                showThemedAlert(
                  "Error",
                  getErrorMessage(err, "Failed to remove duplicate copies")
                );
              });
            } finally {
              setRemoving(false);
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
        <AppPressable
          className={cn(
            "flex-row items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1"
          )}
          onPress={onToggleDuplicatesView}
          accessibilityLabel="Show collection files"
        >
          <Ionicons name="copy" size={14} color={colors.primaryAccent} />
          <Text className="text-[11px] font-semibold text-primary-accent">Back to collections</Text>
        </AppPressable>
      </View>
      {extraCount > 0 ? (
        <Button variant="destructive" loading={removing} disabled={removing} onPress={handleRemoveAllExtras}>
          <Button.Text>Remove all {extraCount} duplicate cop{extraCount === 1 ? "y" : "ies"}</Button.Text>
        </Button>
      ) : null}
    </View>
  );
}
