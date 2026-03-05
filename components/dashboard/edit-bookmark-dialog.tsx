"use client";

import { useState, useCallback, useMemo, useEffect, memo } from "react";
import { useMutation, useAction } from "convex/react";
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
import { toast } from "sonner";

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

interface EditBookmarkDialogProps {
  bookmark: Bookmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const INITIAL_FORM_STATE: FormState = {
  title: "",
  url: "",
  description: "",
};

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const EditBookmarkDialog = memo(function EditBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
  userId,
}: EditBookmarkDialogProps) {
  // Form state - initialized from bookmark when dialog opens
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasExistingDescription, setHasExistingDescription] = useState(false);

  const updateBookmark = useMutation(api.bookmarks.updateBookmarkDetails);
  const generateDescription = useAction(
    api.metadata.generateBookmarkDescription,
  );

  // Sync form when dialog opens
  useEffect(() => {
    if (open && bookmark) {
      const existingDesc = bookmark.description || "";
      setForm({
        title: bookmark.title,
        url: bookmark.url,
        description: existingDesc,
      });
      setHasExistingDescription(!!existingDesc);
      setIsGenerating(false);
    }
  }, [open, bookmark]);

  // Handle dialog close
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setForm(INITIAL_FORM_STATE);
        setIsGenerating(false);
        setHasExistingDescription(false);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange],
  );

  // Derived state
  const descriptionLength = form.description.length;
  const canSave = form.title.trim() && form.url.trim();
  const isValidUrl = !form.url.trim() || validateUrl(form.url);

  // Form field updates
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleGenerateDescription = useCallback(async () => {
    if (!form.url) {
      toast.error("Please enter a URL first");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateDescription({
        url: form.url,
        userId,
      });

      if (result.success && result.description) {
        setForm((prev) => ({
          ...prev,
          description: result.description ?? "",
          ...(result.title && !prev.title ? { title: result.title } : {}),
        }));
        toast.success("Description generated successfully");
      } else {
        toast.error(result.error || "Failed to generate description");
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error(
        "Failed to generate description. Try again or enter manually.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [form.url, userId, generateDescription]);

  const handleSave = useCallback(async () => {
    if (!bookmark || !userId) return;

    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!form.url.trim()) {
      toast.error("URL is required");
      return;
    }

    if (!validateUrl(form.url)) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      await updateBookmark({
        bookmarkId: bookmark.id as Id<"bookmarks">,
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim() || undefined,
        userId,
      });

      toast.success("Bookmark updated successfully");
      handleOpenChange(false);
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  }, [bookmark, userId, form, updateBookmark, handleOpenChange]);

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
    if (isGenerating) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      );
    }
    if (hasExistingDescription && form.description) {
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
  }, [isGenerating, hasExistingDescription, form.description]);

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
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Bookmark title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={form.url}
              onChange={(e) => updateField("url", e.target.value)}
              placeholder="https://example.com"
            />
            {!isValidUrl && form.url && (
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
              {hasExistingDescription && form.description && !isGenerating && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  {form.description === bookmark?.description
                    ? "Original"
                    : "Modified"}
                </span>
              )}
            </div>
            <Textarea
              id="description"
              value={form.description}
              onChange={handleDescriptionChange}
              placeholder={
                hasExistingDescription
                  ? "Edit the existing description or regenerate with AI"
                  : "Enter a description or generate with AI"
              }
              rows={3}
            />
            {hasExistingDescription &&
              form.description === bookmark?.description && (
                <p className="text-xs text-muted-foreground">
                  This is the original AI-generated description. You can edit it
                  above or regenerate.
                </p>
              )}
          </div>

          <Button
            variant="outline"
            onClick={handleGenerateDescription}
            disabled={isGenerating || !form.url}
            className="w-full"
          >
            {generateButtonContent}
          </Button>
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
