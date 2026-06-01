import { Ionicons } from "@expo/vector-icons";
import { useCallback, useReducer, useRef } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { useConvex, useMutation } from "convex/react";

import { AppPressable } from "@/components/ui/app-pressable";
import { Button, Input, Modal } from "@/components/ui";
import { useAppTheme } from "@/contexts/app-theme";
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
  const descriptionLength = description.length;
  const { colors } = useAppTheme();
  const canGenerate = Boolean(url.trim()) && !loading;

  return (
    <ScrollView
      className="max-h-[520px]"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-4">
        <Input
          label="Title"
          value={title}
          onChangeText={(t) => dispatch({ type: "setTitle", title: t })}
          placeholder="Bookmark title"
        />
        <Input
          label="URL"
          value={url}
          onChangeText={(u) => dispatch({ type: "setUrl", url: u })}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <View className="gap-2">
          <Text className="font-sans text-sm font-medium text-foreground">
            Description
            <Text className="font-normal text-muted-foreground">
              {" "}
              ({descriptionLength}/{MAX_DESCRIPTION_LENGTH})
            </Text>
          </Text>

          <View className="overflow-hidden rounded-xl border border-input bg-surface">
            <TextInput
              value={description}
              onChangeText={(text) => dispatch({ type: "setDescription", description: text })}
              placeholder="Enter a description or generate with AI"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              editable={!generating}
              className="min-h-[112px] px-3 pb-3 pt-3 font-sans text-sm leading-5 text-foreground"
              style={{ textAlignVertical: "top" }}
            />

            <View className="border-t border-border bg-muted/35 px-3 py-2.5">
              <AppPressable
                onPress={() => void handleGenerateDescription()}
                disabled={!canGenerate || generating}
                className="flex-row items-center justify-center gap-2 rounded-lg py-2 active:bg-accent disabled:opacity-45"
              >
                {generating ? (
                  <ActivityIndicator size="small" color={colors.primaryAccent} />
                ) : (
                  <Ionicons
                    name={hasDescription ? "refresh-outline" : "sparkles-outline"}
                    size={16}
                    color={canGenerate ? colors.primaryAccent : colors.textMuted}
                  />
                )}
                <Text
                  className={
                    canGenerate && !generating
                      ? "font-sans text-sm font-medium text-primary-accent"
                      : "font-sans text-sm font-medium text-muted-foreground"
                  }
                >
                  {genLabel}
                </Text>
              </AppPressable>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2 pt-1">
          <Button variant="outline" onPress={onClose} disabled={loading || generating} className="flex-1">
            <Button.Text>Cancel</Button.Text>
          </Button>
          <Button
            onPress={handleSave}
            disabled={loading || generating || !title.trim() || !url.trim()}
            loading={loading}
            className="flex-1"
          >
            <Button.Text>Save</Button.Text>
          </Button>
        </View>
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
    <Modal visible={visible} onClose={onClose} title="Edit bookmark" variant="bottom" compact={false}>
      <EditBookmarkFormBody key={bookmark._id} bookmark={bookmark} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
