"use client";

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
import { toast } from "sonner";

interface DeleteVaultFileDialogProps {
  fileId: string | null;
  fileName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteVaultFileDialog({
  fileId,
  fileName,
  open,
  onOpenChange,
}: DeleteVaultFileDialogProps) {
  const deleteFile = useMutation(api.vault.deleteFile);

  async function handleConfirm() {
    if (!fileId) return;
    try {
      await deleteFile({ fileId: fileId as Id<"vaultFiles"> });
      toast.success("File deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete file");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader className="space-y-2">
          <DialogTitle>Delete File</DialogTitle>
        </DialogHeader>
        <div className="px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to delete &quot;{fileName}&quot;? This action
            cannot be undone.
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
