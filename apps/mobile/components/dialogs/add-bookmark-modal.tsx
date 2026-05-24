import { useState } from "react";
import { View } from "react-native";
import { useMutation } from "convex/react";

import { Button, Input, Modal } from "@/components/ui";
import { showThemedAlert } from "@/contexts/themed-alert";
import { normalizeUrl } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AddBookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: Id<"groups"> | null;
}

export function AddBookmarkModal({ visible, onClose, groupId }: AddBookmarkModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const createBookmark = useMutation(api.bookmarks.mutations.createBookMark);

  async function handleAdd() {
    if (!url.trim() || !groupId) return;

    setLoading(true);
    try {
      const normalizedUrl = normalizeUrl(url.trim());
      await createBookmark({
        groupId,
        url: normalizedUrl,
        title: normalizedUrl,
        imageUrl: "",
      });
      setUrl("");
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to add bookmark");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setUrl("");
    onClose();
  }

  return (
    <Modal visible={visible} onClose={handleClose} title="Add Bookmark" variant="center">
      <View className="gap-3 p-4">
        <Input
          placeholder="Enter URL or paste link..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Button
          onPress={handleAdd}
          disabled={!url.trim()}
          loading={loading}
          className="mt-1"
        >
          <Button.Text>Add Bookmark</Button.Text>
        </Button>
      </View>
    </Modal>
  );
}
