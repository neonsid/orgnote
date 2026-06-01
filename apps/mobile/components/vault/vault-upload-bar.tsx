import { Text, View } from "react-native";

import { Button } from "@/components/ui";
import { VAULT_MAX_FILE_SIZE_BYTES, VAULT_MAX_FILES_PER_BATCH } from "@goldfish/shared";

export function VaultUploadBar({
  effectiveGroupId,
  uploading,
  onPickAndUpload,
}: {
  effectiveGroupId: string | null;
  uploading: boolean;
  onPickAndUpload: () => void;
}) {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5">
      <Button
        onPress={onPickAndUpload}
        disabled={!effectiveGroupId || uploading}
        loading={uploading}
        variant="outline"
        size="sm"
        className="shrink-0"
      >
        <Button.Text>Add files</Button.Text>
      </Button>
      <Text className="flex-1 font-sans text-sm leading-5 text-muted-foreground">
        {effectiveGroupId
          ? `Up to ${VAULT_MAX_FILES_PER_BATCH} files per batch, ${VAULT_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB each.`
          : "Select a collection in the header to upload."}
      </Text>
    </View>
  );
}
