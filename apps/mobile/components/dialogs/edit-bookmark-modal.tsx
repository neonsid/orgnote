import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useConvex, useMutation } from "convex/react";

import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
import { showThemedAlert } from "@/contexts/themed-alert";
import { waitForBookmarkDescriptionJob } from "@/lib/poll-convex-query";
import { spacing } from "@/lib/constants";
import { MAX_DESCRIPTION_LENGTH } from "../../../../convex/lib/constants";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface EditBookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  bookmark: {
    _id: Id<"bookmarks">;
    title: string;
    url: string;
    description?: string;
  } | null;
}

export function EditBookmarkModal({
  visible,
  onClose,
  onSaved,
  bookmark,
}: EditBookmarkModalProps) {
  const { colors } = useAppTheme();
  const convex = useConvex();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const updateDetails = useMutation(api.bookmarks.mutations.updateBookmarkDetails);
  const requestBookmarkDescription = useMutation(api.bookmarks.mutations.requestBookmarkDescription);
  const cancelBookmarkDescriptionJob = useMutation(api.bookmarks.mutations.cancelBookmarkDescriptionJob);

  const descriptionAbortRef = useRef<AbortController | null>(null);
  const activeJobIdRef = useRef<Id<"bookmarkDescriptionJobs"> | null>(null);

  const cancelGeneration = useCallback(async () => {
    const jobId = activeJobIdRef.current;
    if (jobId) {
      try {
        await cancelBookmarkDescriptionJob({ jobId });
      } catch {
        /* ignore */
      }
    }
    descriptionAbortRef.current?.abort();
  }, [cancelBookmarkDescriptionJob]);

  useEffect(() => {
    if (bookmark && visible) {
      setTitle(bookmark.title ?? "");
      setUrl(bookmark.url ?? "");
      setDescription(bookmark.description ?? "");
    }
  }, [bookmark, visible]);

  useEffect(() => {
    return () => {
      void cancelGeneration();
    };
  }, [cancelGeneration]);

  async function handleGenerateDescription() {
    const u = url.trim();
    if (!u) {
      showThemedAlert("URL required", "Enter a URL first so we can fetch the page.");
      return;
    }

    await cancelGeneration();
    const abort = new AbortController();
    descriptionAbortRef.current = abort;
    activeJobIdRef.current = null;
    setGenerating(true);

    try {
      const jobId = await requestBookmarkDescription({ url: u });
      activeJobIdRef.current = jobId;
      const result = await waitForBookmarkDescriptionJob(convex, jobId, {
        signal: abort.signal,
      });

      if (result.success && result.description) {
        const nextDesc = (result.description ?? "").slice(0, MAX_DESCRIPTION_LENGTH);
        setDescription(nextDesc);
        if (result.title && !title.trim()) {
          setTitle(result.title);
        }
        showThemedAlert("Done", "Description was generated. You can edit it before saving.");
      } else {
        showThemedAlert("Could not generate", result.error ?? "Try again or type a description manually.");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      showThemedAlert(
        "Error",
        e instanceof Error ? e.message : "Failed to generate description. Try again or enter manually."
      );
    } finally {
      activeJobIdRef.current = null;
      descriptionAbortRef.current = null;
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!bookmark) return;
    const t = title.trim();
    const u = url.trim();
    if (!t || !u) {
      showThemedAlert("Missing fields", "Title and URL are required.");
      return;
    }

    setLoading(true);
    try {
      await updateDetails({
        bookmarkId: bookmark._id,
        title: t,
        url: u,
        description: description.trim(),
      });
      onSaved?.();
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!bookmark) return null;

  const hasDescription = Boolean(description.trim());
  const genLabel = generating ? "Generating…" : hasDescription ? "Regenerate with AI" : "Generate with AI";

  return (
    <Modal visible={visible} onClose={onClose} title="Edit bookmark" variant="bottom">
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.surface }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fields}>
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Title" />
          <Input
            label="URL"
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={[styles.descHelp, { color: colors.textMuted }]}>
            Description (max {MAX_DESCRIPTION_LENGTH} characters) — generate from the URL or edit manually.
          </Text>
          <Input
            label="Description"
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
            placeholder="Optional"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          <View style={styles.genRow}>
            <Button
              variant="outline"
              onPress={() => void handleGenerateDescription()}
              disabled={generating || loading || !url.trim()}
              loading={generating}
            >
              {genLabel}
            </Button>
          </View>
          <Button onPress={handleSave} disabled={loading || generating || !title.trim() || !url.trim()} loading={loading}>
            Save
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 520,
  },
  fields: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  descHelp: {
    fontSize: 12,
    lineHeight: 16,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  genRow: {
    marginTop: -spacing.xs,
  },
});
