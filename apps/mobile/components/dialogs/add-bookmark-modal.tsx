import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { Button, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/lib/show-themed-alert";
import { normalizeUrl } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AddBookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: Id<"groups"> | null;
  groupTitle?: string | null;
}

export function AddBookmarkModal({
  visible,
  onClose,
  groupId,
  groupTitle,
}: AddBookmarkModalProps) {
  const { colors } = useAppTheme();
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const createBookmark = useMutation(api.bookmarks.mutations.createBookMark);

  const destination = groupTitle?.trim() || "your collection";
  const canSubmit = Boolean(url.trim() && groupId);

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
    }
    setLoading(false);
  }

  function handleClose() {
    setUrl("");
    onClose();
  }

  async function handlePasteFromClipboard() {
    try {
      const text = (await Clipboard.getStringAsync()).trim();
      if (!text) {
        showThemedAlert("Nothing to paste", "Your clipboard is empty.");
        return;
      }
      setUrl(text);
    } catch {
      showThemedAlert("Error", "Could not read from clipboard.");
    }
  }

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Add bookmark"
      subtitle={`Save a link to ${destination}`}
      variant="bottom"
      compact={false}
      showHandle
    >
      <View className="gap-5">
        <View className="gap-2">
          <Text className="font-sans text-sm font-medium text-foreground">Link</Text>
          <View
            className="flex-row items-center gap-2.5 rounded-xl border bg-surface px-3"
            style={{ borderColor: focused ? colors.ring : colors.input }}
          >
            <View
              className="size-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${colors.primaryAccent}18` }}
            >
              <Ionicons name="link-outline" size={18} color={colors.primaryAccent} />
            </View>
            <TextInput
              className="min-h-11 flex-1 py-2.5 font-sans text-base text-foreground"
              placeholder="https://example.com/article"
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={() => void handleAdd()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {url.length > 0 ? (
              <AppPressable onPress={() => setUrl("")} hitSlop={8} className="p-1">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </AppPressable>
            ) : (
              <AppPressable
                onPress={() => void handlePasteFromClipboard()}
                className="rounded-lg bg-muted px-2.5 py-1.5 active:bg-accent"
              >
                <Text className="font-sans text-xs font-medium text-primary-accent">Paste</Text>
              </AppPressable>
            )}
          </View>
          <Text className="font-sans text-xs leading-5 text-muted-foreground">
            Title and preview are fetched automatically after you save.
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Button variant="outline" onPress={handleClose} disabled={loading} className="flex-1">
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button
            onPress={() => void handleAdd()}
            disabled={!canSubmit}
            loading={loading}
            className="flex-1"
          >
            <Button.Text>Add bookmark</Button.Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
