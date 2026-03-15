"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/react";
import { Id } from "@/convex/_generated/dataModel";
import { VaultHeader } from "./vault-header";
import { VaultUpload } from "./vault-upload";
import { VaultFileList } from "./vault-file-list";
import { useDialogStore } from "@/stores/dialog-store";
import {
  useVaultData,
  type VaultFile,
  type VaultGroup,
} from "@/hooks/use-vault-data";
import dynamic from "next/dynamic";

const DeleteVaultFileDialog = dynamic(
  () =>
    import("./dialog/delete-vault-file-dialog").then(
      (m) => m.DeleteVaultFileDialog,
    ),
  { ssr: false },
);

export default function VaultPage() {
  const { user, isLoaded } = useUser();
  const hasAutoSelected = useRef(false);

  const {
    deleteVaultFile,
    openDeleteVaultFileDialog,
    closeDeleteVaultFileDialog,
  } = useDialogStore();

  const { groups, files, effectiveGroupId, selectGroup, isLoading } =
    useVaultData(!!user);

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
    (fileId: Id<"vaultFiles">, fileName: string) => {
      openDeleteVaultFileDialog(fileId, fileName);
    },
    [openDeleteVaultFileDialog],
  );

  const handleSelectGroup = useCallback(
    (groupId: string | null) => {
      if (groupId) {
        selectGroup(groupId);
      }
    },
    [selectGroup],
  );

  const handleCreated = useCallback(
    (groupId: string) => {
      selectGroup(groupId);
    },
    [selectGroup],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <VaultHeader
        groups={groups}
        selectedGroupId={effectiveGroupId || null}
        onSelectGroup={handleSelectGroup}
        onCreated={handleCreated}
        isLoading={isLoading}
      />

      <main className="container mx-auto max-w-4xl p-4 space-y-6">
        <VaultUpload
          selectedGroupId={effectiveGroupId || null}
          groups={groups}
          isLoading={isLoading}
        />

        <VaultFileList
          files={files}
          onDeleteFile={handleDeleteFile}
          isLoading={isLoading}
        />
      </main>

      <DeleteVaultFileDialog
        fileId={deleteVaultFile.fileId}
        fileName={deleteVaultFile.fileName}
        open={deleteVaultFile.open}
        onOpenChange={closeDeleteVaultFileDialog}
      />
    </div>
  );
}
