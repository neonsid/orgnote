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
    <View className="flex-row items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <Button
        onPress={onPickAndUpload}
        disabled={!effectiveGroupId || uploading}
        loading={uploading}
        variant="outline"
        className="shrink-0"
      >
        <Button.Text>Add files</Button.Text>
      </Button>
      <Text className="flex-1 text-xs leading-4 text-muted-foreground">
        {effectiveGroupId
          ? `Up to ${VAULT_MAX_FILES_PER_BATCH} files per batch, ${VAULT_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB each (images, PDF, EPUB, zip, …).`
          : "Select a collection in the header to upload into it."}
      </Text>
    </View>
  );
}
