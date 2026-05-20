import { useCallback, useReducer, useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { useConvex, useMutation } from "convex/react";

import { Button, Input, Modal } from "@/components/ui";
import { showThemedAlert } from "@/contexts/themed-alert";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { waitForBookmarkDescriptionJob } from "@/lib/poll-convex-query";
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

type EditBookmarkFormState = {
  title: string;
  url: string;
  description: string;
  loading: boolean;
  generating: boolean;
};

type EditBookmarkFormAction =
  | { type: "setTitle"; title: string }
  | { type: "setUrl"; url: string }
  | { type: "setDescription"; description: string }
  | { type: "setLoading"; loading: boolean }
  | { type: "setGenerating"; generating: boolean }
  | { type: "applyGenerated"; description: string; suggestedTitle?: string | null };

function initialEditBookmarkFormState(
  b: NonNullable<EditBookmarkModalProps["bookmark"]>,
): EditBookmarkFormState {
  return {
    title: b.title ?? "",
    url: b.url ?? "",
    description: b.description ?? "",
    loading: false,
    generating: false,
  };
}

function editBookmarkFormReducer(
  state: EditBookmarkFormState,
  action: EditBookmarkFormAction,
): EditBookmarkFormState {
  switch (action.type) {
    case "setTitle":
      return { ...state, title: action.title };
    case "setUrl":
      return { ...state, url: action.url };
    case "setDescription":
      return { ...state, description: action.description.slice(0, MAX_DESCRIPTION_LENGTH) };
    case "setLoading":
      return { ...state, loading: action.loading };
    case "setGenerating":
      return { ...state, generating: action.generating };
    case "applyGenerated": {
      const nextDesc = action.description.slice(0, MAX_DESCRIPTION_LENGTH);
      const nextTitle =
        action.suggestedTitle && !state.title.trim()
          ? action.suggestedTitle
          : state.title;
      return { ...state, description: nextDesc, title: nextTitle };
    }
    default:
      return state;
  }
}

function EditBookmarkFormBody({
  bookmark,
  onClose,
  onSaved,
}: Pick<EditBookmarkModalProps, "bookmark" | "onClose" | "onSaved"> & {
  bookmark: NonNullable<EditBookmarkModalProps["bookmark"]>;
}) {
  const convex = useConvex();
  const [state, dispatch] = useReducer(editBookmarkFormReducer, bookmark, initialEditBookmarkFormState);
  const { title, url, description, loading, generating } = state;

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

  useMountEffect(() => {
    return () => {
      void cancelGeneration();
    };
  });

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
    dispatch({ type: "setGenerating", generating: true });

    try {
      const jobId = await requestBookmarkDescription({ url: u });
      activeJobIdRef.current = jobId;
      const result = await waitForBookmarkDescriptionJob(convex, jobId, {
        signal: abort.signal,
      });

      if (result.success && result.description) {
        dispatch({
          type: "applyGenerated",
          description: result.description ?? "",
          suggestedTitle: result.title ?? null,
        });
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
      dispatch({ type: "setGenerating", generating: false });
    }
  }

  async function handleSave() {
    const t = title.trim();
    const u = url.trim();
    if (!t || !u) {
      showThemedAlert("Missing fields", "Title and URL are required.");
      return;
    }

    dispatch({ type: "setLoading", loading: true });
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
      dispatch({ type: "setLoading", loading: false });
    }
  }

  const hasDescription = Boolean(description.trim());
  const genLabel = generating ? "Generating…" : hasDescription ? "Regenerate with AI" : "Generate with AI";

  return (
    <ScrollView
      className="max-h-[520px] bg-surface"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-3 p-4">
        <Input
          label="Title"
          value={title}
          onChangeText={(t) => dispatch({ type: "setTitle", title: t })}
          placeholder="Title"
        />
        <Input
          label="URL"
          value={url}
          onChangeText={(u) => dispatch({ type: "setUrl", url: u })}
          placeholder="https://…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text className="text-xs leading-4 text-muted-foreground">
          Description (max {MAX_DESCRIPTION_LENGTH} characters) — generate from the URL or edit manually.
        </Text>
        <Input
          label="Description"
          value={description}
          onChangeText={(text) => dispatch({ type: "setDescription", description: text })}
          placeholder="Optional"
          multiline
          numberOfLines={4}
          className="min-h-24 pt-3"
          style={{ textAlignVertical: "top" }}
        />
        <View className="-mt-1">
          <Button
            variant="outline"
            onPress={() => void handleGenerateDescription()}
            disabled={generating || loading || !url.trim()}
            loading={generating}
          >
            <Button.Text>{genLabel}</Button.Text>
          </Button>
        </View>
        <Button onPress={handleSave} disabled={loading || generating || !title.trim() || !url.trim()} loading={loading}>
          <Button.Text>Save</Button.Text>
        </Button>
      </View>
    </ScrollView>
  );
}

export function EditBookmarkModal({
  visible,
  onClose,
  onSaved,
  bookmark,
}: EditBookmarkModalProps) {
  if (!bookmark) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Edit bookmark" variant="bottom">
      <EditBookmarkFormBody key={bookmark._id} bookmark={bookmark} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
