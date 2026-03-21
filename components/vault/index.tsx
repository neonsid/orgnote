"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/react";
import { Id } from "@/convex/_generated/dataModel";
import { VaultUpload } from "./vault-upload";
import { VaultFileGallery } from "./vault-file-gallery";
import { useDialogStore } from "@/stores/dialog-store";
import { useVaultData } from "@/hooks/use-vault-data";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardHeader } from "../dashboard/dashboard-header";
import { VaultFile } from "../dashboard/bookmark-list/types";
import { toast } from "sonner";

const DeleteBookmarkDialog = dynamic(
  () =>
    import("../dashboard/dialog/delete-bookmark-dialog").then(
      (m) => m.DeleteBookmarkDialog,
    ),
  { ssr: false },
);

export default function VaultPage() {
  const { user, isLoaded } = useUser();
  const hasAutoSelected = useRef(false);

  const {
    deleteBookmarkOrItem,
    openDeleteBookmarkDialog,
    closeDeleteBookmarkDialog,
  } = useDialogStore();

  const { groups, files, effectiveGroupId, selectGroup, isLoading } =
    useVaultData(!!user);

  const createVaultGroup = useMutation(api.vault.createVaultGroup);
  const deleteFile = useMutation(api.vault.deleteFile);

  useEffect(() => {
    if (
      groups &&
      groups.length > 0 &&
      !effectiveGroupId &&
      !hasAutoSelected.current
    ) {
      const latestGroup = [...groups].sort(
        (a, b) => b.createdAt - a.createdAt,
      )[0];
      selectGroup(latestGroup._id);
      hasAutoSelected.current = true;
    }
  }, [groups, effectiveGroupId, selectGroup]);

  const handleDeleteFile = useCallback(
    (file: VaultFile) => {
      openDeleteBookmarkDialog(file._id as Id<"vaultFiles">, file.name);
    },
    [openDeleteBookmarkDialog],
  );

  const handleConfirmDelete = useCallback(async () => {
    const fileId = deleteBookmarkOrItem.bookmarkOrFileId;

    if (!fileId) return;

    closeDeleteBookmarkDialog();

    toast.promise(deleteFile({ fileId: fileId as Id<"vaultFiles"> }), {
      loading: "Deleting...",
      success: "File deleted",
      error: "Failed to delete file",
    });
  }, [deleteBookmarkOrItem, closeDeleteBookmarkDialog, deleteFile]);

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        variant="vault"
        showPublicButton={false}
        createGroup={createVaultGroup}
        groups={groups}
        effectiveGroupId={effectiveGroupId}
        onSelectGroup={
          selectGroup as (id: Id<"groups"> | Id<"vaultGroups">) => void
        }
        loading={isLoading}
      />

      <main className="container mx-auto max-w-4xl p-4 space-y-6">
        <VaultUpload
          selectedGroupId={effectiveGroupId || null}
          groups={groups}
          files={files}
          isLoading={isLoading}
          onDeleteFile={handleDeleteFile}
        />
      </main>

      <DeleteBookmarkDialog
        bookmarkOrFileId={deleteBookmarkOrItem.bookmarkOrFileId}
        title={deleteBookmarkOrItem.title}
        variant="File"
        open={deleteBookmarkOrItem.open}
        onOpenChange={closeDeleteBookmarkDialog}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
}
