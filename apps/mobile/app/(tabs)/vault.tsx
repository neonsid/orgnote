import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { View } from "react-native";

import {
  VaultGroupSelectorModal,
  VaultMoveFileModal,
  CreateGroupModal,
  EditGroupModal,
  DeleteGroupModal,
} from "@/components/dialogs";
import { Loading, EmptyState, ScreenShell } from "@/components/ui";
import {
  FileActionsModal,
  UploadProgressOverlay,
  VaultDuplicatesBanner,
  VaultFileList,
  VaultHeader,
  VaultMultiSelectToolbar,
  VaultStatsBar,
  VaultUploadBar,
} from "@/components/vault";
import { showThemedAlert } from "@/contexts/themed-alert";
import { useVaultTabUiReducer, useVaultUpload, useVaultSelection } from "@/hooks";
import { openInAppBrowser } from "@/lib/open-in-app-browser";
import {
  countDuplicateSets,
  getCanonicalFileIds,
  getDuplicateVaultFileIds,
  getOriginalInfoForExtras,
} from "@/lib/vault-duplicates";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

function VaultContent() {
  const vaultData = useQuery(api.vault.queries.getVaultData);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [vaultUi, vaultDispatch] = useVaultTabUiReducer();
  const {
    selectedGroupId,
    showGroupSelector,
    showCreateGroup,
    showEditGroup,
    showDeleteGroup,
    movePickerOpen,
    selectedFile,
  } = vaultUi;

  const effectiveGroupId =
    !vaultData || vaultData.groups.length === 0
      ? null
      : selectedGroupId && vaultData.groups.some((g) => g._id === selectedGroupId)
        ? selectedGroupId
        : (vaultData.groups[0]?._id ?? null);

  const { uploading, uploadStatus, pickAndUpload } = useVaultUpload(effectiveGroupId);
  const moveVaultFile = useMutation(api.vault.mutations.moveVaultFile);

  const selectedGroup =
    !vaultData || !effectiveGroupId
      ? null
      : (vaultData.groups.find((g) => g._id === effectiveGroupId) ?? null);

  const duplicateSetCount = vaultData ? countDuplicateSets(vaultData.files) : 0;

  const viewingDuplicates = showDuplicatesOnly && duplicateSetCount > 0;

  const filteredFiles = (() => {
    if (!vaultData) return [];
    let files = vaultData.files;
    if (viewingDuplicates) {
      const duplicateIds = getDuplicateVaultFileIds(vaultData.files);
      files = files.filter((f) => duplicateIds.has(f._id));
    } else if (effectiveGroupId) {
      files = files.filter((f) => f.groupId === effectiveGroupId);
    }
    return files.sort((a, b) => b._creationTime - a._creationTime);
  })();

  const canonicalFileIds = vaultData
    ? getCanonicalFileIds(vaultData.files)
    : new Set<Id<"vaultFiles">>();

  const originalInfoForExtras = vaultData
    ? getOriginalInfoForExtras(vaultData.files)
    : new Map();

  const groupTitleById = new Map<Id<"vaultGroups">, string>();
  for (const group of vaultData?.groups ?? []) {
    groupTitleById.set(group._id, group.title);
  }

  const selectableFileIds: Id<"vaultFiles">[] = [];
  if (!viewingDuplicates) {
    for (const file of filteredFiles) {
      selectableFileIds.push(file._id);
    }
  } else {
    for (const file of filteredFiles) {
      if (!canonicalFileIds.has(file._id)) {
        selectableFileIds.push(file._id);
      }
    }
  }

  const visibleFileIds = selectableFileIds;

  const {
    selectedIds,
    selectedCount,
    isSelecting,
    isSelected,
    toggleSelection,
    toggleSelectAllVisible,
    allVisibleSelected,
    clearSelection,
  } = useVaultSelection(visibleFileIds);

  const selectedIdSet = new Set(selectedIds);

  const selectedFiles: Array<{
    _id: Id<"vaultFiles">;
    name: string;
    url: string;
    type: string;
  }> = [];
  for (const file of filteredFiles) {
    if (selectedIdSet.has(file._id)) {
      selectedFiles.push({
        _id: file._id,
        name: file.name,
        url: file.url,
        type: file.type,
      });
    }
  }

  const filesById = new Map(filteredFiles.map((file) => [file._id, file]));

  function handleFilePress(fileId: Id<"vaultFiles">) {
    const file = filesById.get(fileId);
    if (!file) return;

    if (isSelecting) {
      if (viewingDuplicates && canonicalFileIds.has(file._id)) return;
      toggleSelection(file._id);
    } else {
      void openInAppBrowser(file.url, file.name);
    }
  }

  function handleFileLongPress(fileId: Id<"vaultFiles">) {
    const file = filesById.get(fileId);
    if (!file) return;

    if (viewingDuplicates && canonicalFileIds.has(file._id)) return;

    if (isSelecting) {
      toggleSelection(file._id);
      return;
    }

    vaultDispatch({
      type: "setSelectedFile",
      file: {
        _id: file._id,
        name: file.name,
        url: file.url,
        type: file.type,
      },
    });
  }

  const moveTargetGroups =
    !vaultData || !effectiveGroupId
      ? []
      : vaultData.groups.filter((g) => g._id !== effectiveGroupId);

  async function handleSelectMoveTarget(groupId: Id<"vaultGroups">) {
    if (!selectedFile) return;
    try {
      await moveVaultFile({ fileId: selectedFile._id, groupId });
      vaultDispatch({ type: "afterMoveSuccess" });
    } catch {
      showThemedAlert("Error", "Failed to move file");
    }
  }

  function handleToggleDuplicatesView() {
    if (duplicateSetCount === 0) {
      // Reset stale flag when there are no duplicates
      if (showDuplicatesOnly) setShowDuplicatesOnly(false);
      showThemedAlert(
        "No duplicates",
        "Every file in your vault is unique — no duplicates across collections."
      );
      return;
    }
    // Use derived viewingDuplicates to determine next state
    // This handles stale showDuplicatesOnly state correctly
    setShowDuplicatesOnly(!viewingDuplicates);
    clearSelection();
    vaultDispatch({ type: "setShowGroupSelector", open: false });
  }

  function onVaultGroupCreated(groupId: Id<"vaultGroups">) {
    vaultDispatch({ type: "setSelectedGroupId", id: groupId });
    clearSelection();
    setShowDuplicatesOnly(false);
  }

  const statsLabel = viewingDuplicates
    ? `${duplicateSetCount} duplicate set${duplicateSetCount === 1 ? "" : "s"} · ${filteredFiles.length} files`
    : `${vaultData?.groups.length ?? 0} collections • ${filteredFiles.length} files`;

  if (vaultData === undefined) {
    return <Loading message="Loading vault..." />;
  }

  return (
    <View className="flex-1">
      <VaultHeader
        selectedGroup={selectedGroup}
        onOpenGroupSelector={() => vaultDispatch({ type: "setShowGroupSelector", open: true })}
      />

      {viewingDuplicates ? (
        <VaultDuplicatesBanner
          allFiles={vaultData.files}
          statsLabel={statsLabel}
          onToggleDuplicatesView={handleToggleDuplicatesView}
          onDuplicatesCleared={() => {
            clearSelection();
            setShowDuplicatesOnly(false);
          }}
        />
      ) : (
        <View className="gap-4 px-4 pb-4 pt-3">
          <VaultStatsBar statsLabel={statsLabel} />
          {!isSelecting && !viewingDuplicates && vaultData.groups.length > 0 ? (
            <VaultUploadBar
              effectiveGroupId={effectiveGroupId}
              uploading={uploading}
              onPickAndUpload={() => void pickAndUpload()}
            />
          ) : null}
        </View>
      )}

      {filteredFiles.length === 0 ? (
        <EmptyState
          title="No files yet"
          description={
            vaultData.groups.length === 0
              ? "Create a collection, then add files."
              : effectiveGroupId
                ? "Tap Add files to upload from this device."
                : "Choose a collection above, then use Add files."
          }
          actionLabel={effectiveGroupId ? "Add files" : undefined}
          onAction={effectiveGroupId ? () => void pickAndUpload() : undefined}
        />
      ) : (
        <VaultFileList
          files={filteredFiles}
          viewingDuplicates={viewingDuplicates}
          isSelecting={isSelecting}
          canonicalFileIds={canonicalFileIds}
          originalInfoForExtras={originalInfoForExtras}
          groupTitleById={groupTitleById}
          isSelected={isSelected}
          onFilePress={handleFilePress}
          onFileLongPress={handleFileLongPress}
        />
      )}

      {isSelecting ? (
        <VaultMultiSelectToolbar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          selectedFiles={selectedFiles}
          groups={vaultData.groups}
          allVaultFiles={vaultData.files}
          currentGroupId={viewingDuplicates ? null : effectiveGroupId}
          isDuplicatesMode={viewingDuplicates}
          allVisibleSelected={allVisibleSelected}
          onClearSelection={clearSelection}
          onToggleSelectAllVisible={toggleSelectAllVisible}
        />
      ) : null}

      <VaultGroupSelectorModal
        visible={showGroupSelector}
        onClose={() => vaultDispatch({ type: "setShowGroupSelector", open: false })}
        groups={vaultData.groups}
        selectedGroupId={effectiveGroupId}
        onSelectGroup={(id) => {
          vaultDispatch({ type: "setSelectedGroupId", id });
          clearSelection();
          setShowDuplicatesOnly(false);
        }}
        onCreateGroup={() => vaultDispatch({ type: "groupSelectorToCreate" })}
        onRenameGroup={() => vaultDispatch({ type: "groupSelectorToEdit" })}
        onDeleteGroup={() => vaultDispatch({ type: "groupSelectorToDelete" })}
        duplicateSetCount={duplicateSetCount}
        viewingDuplicates={viewingDuplicates}
        onShowDuplicates={handleToggleDuplicatesView}
      />

      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => vaultDispatch({ type: "setShowCreateGroup", open: false })}
        groupKind="vault"
        onCreated={onVaultGroupCreated}
      />

      <EditGroupModal
        visible={showEditGroup}
        onClose={() => vaultDispatch({ type: "setShowEditGroup", open: false })}
        groupKind="vault"
        group={selectedGroup}
      />

      <DeleteGroupModal
        visible={showDeleteGroup}
        onClose={() => vaultDispatch({ type: "setShowDeleteGroup", open: false })}
        groupKind="vault"
        group={selectedGroup}
        onDeleted={(deletedId) => {
          if (selectedGroupId === deletedId) {
            vaultDispatch({ type: "setSelectedGroupId", id: null });
          }
        }}
      />

      <FileActionsModal
        visible={!!selectedFile && !movePickerOpen && !isSelecting}
        onClose={() => vaultDispatch({ type: "setSelectedFile", file: null })}
        file={selectedFile}
        canMoveToAnotherGroup={moveTargetGroups.length > 0}
        onRequestMoveToAnotherGroup={() => vaultDispatch({ type: "openMovePicker" })}
        onSelectMultiple={() => {
          if (!selectedFile) return;
          toggleSelection(selectedFile._id);
          vaultDispatch({ type: "setSelectedFile", file: null });
        }}
      />

      <VaultMoveFileModal
        visible={movePickerOpen && !!selectedFile}
        onClose={() => vaultDispatch({ type: "setMovePickerOpen", open: false })}
        fileName={selectedFile?.name ?? ""}
        groups={moveTargetGroups}
        onSelectGroup={(groupId) => void handleSelectMoveTarget(groupId)}
      />

      {uploading && uploadStatus ? <UploadProgressOverlay status={uploadStatus} /> : null}
    </View>
  );
}

export default function VaultScreen() {
  const { isLoaded: clerkLoaded, isSignedIn, userId } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  if (!clerkLoaded) {
    return (
      <ScreenShell>
        <Loading message="Loading..." />
      </ScreenShell>
    );
  }

  if (!isSignedIn) {
    return <ScreenShell />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <ScreenShell>
        <Loading message="Connecting..." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <VaultContent key={userId ?? "unknown-user"} />
    </ScreenShell>
  );
}
