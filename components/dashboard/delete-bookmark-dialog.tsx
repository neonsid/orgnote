"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
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

interface Bookmark {
  id: string;
  title: string;
}

interface DeleteBookmarkDialogProps {
  bookmark: Bookmark | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function DeleteBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
  userId,
}: DeleteBookmarkDialogProps) {
  const deleteBookmark = useMutation(api.bookmarks.deleteBookMark);

  const handleConfirm = useCallback(async () => {
    if (!bookmark || !userId) return;
    await deleteBookmark({
      bookmarkId: bookmark.id as Id<"bookmarks">,
      userId,
    });
    onOpenChange(false);
  }, [bookmark, deleteBookmark, onOpenChange, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader className="space-y-2">
          <DialogTitle>Delete Bookmark</DialogTitle>
        </DialogHeader>
        <div className="px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete &quot;{bookmark?.title}&quot;? This
            action cannot be undone.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
