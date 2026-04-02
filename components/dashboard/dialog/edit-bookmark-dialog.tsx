"use client";

import {
  useReducer,
  useCallback,
  useMemo,
  memo,
  useRef,
  useState,
} from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, RefreshCw, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { waitForBookmarkDescriptionJob } from "@/lib/poll-convex-query";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
}

interface FormState {
  title: string;
  url: string;
  description: string;
}

interface DialogState {
  form: FormState;
  isGenerating: boolean;
  hasExistingDescription: boolean;
}

type DialogAction =
  | { type: "reset" }
  | { type: "setGenerating"; isGenerating: boolean }
  | {
      type: "updateField";
      field: keyof FormState;
      value: FormState[keyof FormState];
    }
  | { type: "mergeForm"; form: Partial<FormState> };

interface EditBookmarkDialogProps {
  bookmark: Bookmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_FORM_STATE: FormState = {
  title: "",
  url: "",
  description: "",
};

const INITIAL_DIALOG_STATE: DialogState = {
  form: INITIAL_FORM_STATE,
  isGenerating: false,
  hasExistingDescription: false,
};

function reducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case "reset":
      return INITIAL_DIALOG_STATE;
    case "setGenerating":
      return { ...state, isGenerating: action.isGenerating };
    case "updateField":
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
      };
    case "mergeForm":
      return { ...state, form: { ...state.form, ...action.form } };
    default:
      return state;
  }
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function dialogStateFromBookmark(b: Bookmark | null): DialogState {
  if (!b) return INITIAL_DIALOG_STATE;
  const existingDesc = b.description || "";
  return {
    form: {
      title: b.title,
      url: b.url,
      description: existingDesc,
    },
    isGenerating: false,
    hasExistingDescription: !!existingDesc,
  };
}

export const EditBookmarkDialog = memo(function EditBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
}: EditBookmarkDialogProps) {
  const [state, dispatch] = useReducer(reducer, bookmark, dialogStateFromBookmark);

  const convex = useConvex();
  const updateBookmark = useMutation(api.bookmarks.mutations.updateBookmarkDetails);
  const requestBookmarkDescription = useMutation(
    api.bookmarks.mutations.requestBookmarkDescription,
  );
  const cancelBookmarkDescriptionJob = useMutation(
    api.bookmarks.mutations.cancelBookmarkDescriptionJob,
  );

  const descriptionAbortRef = useRef<AbortController | null>(null);
  const activeDescriptionJobIdRef = useRef<Id<"bookmarkDescriptionJobs"> | null>(
    null,
  );
  const [descriptionJobIdForCancel, setDescriptionJobIdForCancel] = useState<
    Id<"bookmarkDescriptionJobs"> | null
  >(null);

  // Handle dialog close
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        dispatch({ type: "reset" });
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // Derived state
  const descriptionLength = state.form.description.length;
  const canSave = state.form.title.trim() && state.form.url.trim();
  const isValidUrl = !state.form.url.trim() || validateUrl(state.form.url);

  // Form field updates
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      dispatch({ type: "updateField", field, value });
    },
    [],
  );

  const handleStopDescriptionGeneration = useCallback(async () => {
    const jobId = activeDescriptionJobIdRef.current;
    if (jobId) {
      try {
        await cancelBookmarkDescriptionJob({ jobId });
      } catch (e) {
        console.error("Failed to cancel description job:", e);
      }
    }
    descriptionAbortRef.current?.abort();
  }, [cancelBookmarkDescriptionJob]);

  const handleGenerateDescription = useCallback(async () => {
    if (!state.form.url) {
      toast.error("Please enter a URL first");
      return;
    }

    const abort = new AbortController();
    descriptionAbortRef.current = abort;
    activeDescriptionJobIdRef.current = null;
    setDescriptionJobIdForCancel(null);

    dispatch({ type: "setGenerating", isGenerating: true });

    try {
      const jobId = await requestBookmarkDescription({
        url: state.form.url,
      });
      activeDescriptionJobIdRef.current = jobId;
      setDescriptionJobIdForCancel(jobId);
      const result = await waitForBookmarkDescriptionJob(convex, jobId, {
        signal: abort.signal,
      });

      if (result.success && result.description) {
        dispatch({
          type: "mergeForm",
          form: {
            description: result.description ?? "",
            ...(result.title && !state.form.title
              ? { title: result.title }
              : {}),
          },
        });
        toast.success("Description generated successfully");
      } else {
        toast.error(result.error || "Failed to generate description");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info("Generation cancelled");
        return;
      }
      console.error("Error generating description:", error);
      toast.error(
        "Failed to generate description. Try again or enter manually.",
      );
    } finally {
      activeDescriptionJobIdRef.current = null;
      setDescriptionJobIdForCancel(null);
      descriptionAbortRef.current = null;
      dispatch({ type: "setGenerating", isGenerating: false });
    }
  }, [state.form.url, state.form.title, convex, requestBookmarkDescription]);

  const handleSave = useCallback(async () => {
    if (!bookmark) return;

    if (!state.form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!state.form.url.trim()) {
      toast.error("URL is required");
      return;
    }

    if (!validateUrl(state.form.url)) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      await updateBookmark({
        bookmarkId: bookmark.id as Id<"bookmarks">,
        title: state.form.title.trim(),
        url: state.form.url.trim(),
        description: state.form.description.trim() || undefined,
      });

      toast.success("Bookmark updated successfully");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  }, [bookmark, state.form, updateBookmark, handleOpenChange]);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= 150) {
        updateField("description", value);
      }
    },
    [updateField],
  );

  // Memoized button content for description generation
  const generateButtonContent = useMemo(() => {
    if (state.isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      );
    }
    if (state.hasExistingDescription && state.form.description) {
      return (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate with AI
        </>
      );
    }
    return (
      <>
        <Sparkles className="mr-2 h-4 w-4" />
        Generate with AI
      </>
    );
  }, [
    state.isGenerating,
    state.hasExistingDescription,
    state.form.description,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bookmark</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={state.form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Bookmark title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={state.form.url}
              onChange={(e) => updateField("url", e.target.value)}
              placeholder="https://example.com"
            />
            {!isValidUrl && state.form.url && (
              <p className="text-xs text-destructive">
                Please enter a valid URL
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">
                Description
                <span className="ml-2 text-xs text-muted-foreground">
                  ({descriptionLength}/150)
                </span>
              </Label>
              {state.hasExistingDescription &&
                state.form.description &&
                !state.isGenerating && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    {state.form.description === bookmark?.description
                      ? "Original"
                      : "Modified"}
                  </span>
                )}
            </div>
            <Textarea
              id="description"
              value={state.form.description}
              onChange={handleDescriptionChange}
              placeholder={
                state.hasExistingDescription
                  ? "Edit the existing description or regenerate with AI"
                  : "Enter a description or generate with AI"
              }
              rows={3}
            />
            {state.hasExistingDescription &&
              state.form.description === bookmark?.description && (
                <p className="text-xs text-muted-foreground">
                  This is the original AI-generated description. You can edit it
                  above or regenerate.
                </p>
              )}
          </div>

          {state.isGenerating ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleStopDescriptionGeneration}
                disabled={!descriptionJobIdForCancel}
                className="flex-1"
              >
                Stop
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                className="flex-1"
              >
                {generateButtonContent}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleGenerateDescription}
              disabled={!state.form.url}
              className="w-full"
            >
              {generateButtonContent}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
