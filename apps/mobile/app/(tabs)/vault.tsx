import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  VaultGroupSelectorModal,
  VaultMoveFileModal,
  CreateGroupModal,
  EditGroupModal,
  DeleteGroupModal,
} from "@/components/dialogs";
import { Loading, EmptyState } from "@/components/ui";
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
import { promptOpenExternalUrl } from "@/lib/open-external-url";
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

  const effectiveGroupId = useMemo(() => {
    if (!vaultData || vaultData.groups.length === 0) return null;
    if (selectedGroupId && vaultData.groups.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return vaultData.groups[0]?._id ?? null;
  }, [vaultData, selectedGroupId]);

  const { uploading, uploadStatus, pickAndUpload } = useVaultUpload(effectiveGroupId);
  const moveVaultFile = useMutation(api.vault.mutations.moveVaultFile);

  const selectedGroup = useMemo(() => {
    if (!vaultData || !effectiveGroupId) return null;
    return vaultData.groups.find((g) => g._id === effectiveGroupId) ?? null;
  }, [vaultData, effectiveGroupId]);

  const duplicateSetCount = useMemo(
    () => (vaultData ? countDuplicateSets(vaultData.files) : 0),
    [vaultData]
  );

  const viewingDuplicates = showDuplicatesOnly && duplicateSetCount > 0;

  const filteredFiles = useMemo(() => {
    if (!vaultData) return [];
    let files = vaultData.files;
    if (viewingDuplicates) {
      const duplicateIds = getDuplicateVaultFileIds(vaultData.files);
      files = files.filter((f) => duplicateIds.has(f._id));
    } else if (effectiveGroupId) {
      files = files.filter((f) => f.groupId === effectiveGroupId);
    }
    return files.sort((a, b) => b._creationTime - a._creationTime);
  }, [vaultData, effectiveGroupId, viewingDuplicates]);

  const canonicalFileIds = useMemo(
    () =>
      vaultData
        ? getCanonicalFileIds(vaultData.files)
        : new Set<Id<"vaultFiles">>(),
    [vaultData]
  );

  const originalInfoForExtras = useMemo(
    () => (vaultData ? getOriginalInfoForExtras(vaultData.files) : new Map()),
    [vaultData]
  );

  const groupTitleById = useMemo(() => {
    const map = new Map<Id<"vaultGroups">, string>();
    for (const group of vaultData?.groups ?? []) {
      map.set(group._id, group.title);
    }
    return map;
  }, [vaultData?.groups]);

  const selectableFileIds = useMemo(() => {
    if (!viewingDuplicates) {
      return filteredFiles.map((f) => f._id);
    }

    const ids: Id<"vaultFiles">[] = [];
    for (const file of filteredFiles) {
      if (!canonicalFileIds.has(file._id)) {
        ids.push(file._id);
      }
    }
    return ids;
  }, [filteredFiles, viewingDuplicates, canonicalFileIds]);

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

  useEffect(() => {
    if (showDuplicatesOnly && duplicateSetCount === 0) {
      setShowDuplicatesOnly(false);
      clearSelection();
    }
  }, [showDuplicatesOnly, duplicateSetCount, clearSelection]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedFiles = useMemo(() => {
    const result: Array<{
      _id: Id<"vaultFiles">;
      name: string;
      url: string;
      type: string;
    }> = [];

    for (const file of filteredFiles) {
      if (selectedIdSet.has(file._id)) {
        result.push({
          _id: file._id,
          name: file.name,
          url: file.url,
          type: file.type,
        });
      }
    }

    return result;
  }, [filteredFiles, selectedIdSet]);

  const filesById = useMemo(
    () => new Map(filteredFiles.map((file) => [file._id, file])),
    [filteredFiles]
  );

  const handleFilePress = useCallback(
    (fileId: Id<"vaultFiles">) => {
      const file = filesById.get(fileId);
      if (!file) return;

      if (isSelecting) {
        if (viewingDuplicates && canonicalFileIds.has(file._id)) return;
        toggleSelection(file._id);
      } else {
        void promptOpenExternalUrl(file.url, file.name);
      }
    },
    [filesById, isSelecting, toggleSelection, viewingDuplicates, canonicalFileIds]
  );

  const handleFileLongPress = useCallback(
    (fileId: Id<"vaultFiles">) => {
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
    },
    [filesById, isSelecting, toggleSelection, viewingDuplicates, canonicalFileIds]
  );

  const moveTargetGroups = useMemo(() => {
    if (!vaultData || !effectiveGroupId) return [];
    return vaultData.groups.filter((g) => g._id !== effectiveGroupId);
  }, [vaultData, effectiveGroupId]);

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
      showThemedAlert(
        "No duplicates",
        "Every file in your vault is unique — no duplicates across collections."
      );
      return;
    }
    setShowDuplicatesOnly((prev) => !prev);
    clearSelection();
    vaultDispatch({ type: "setShowGroupSelector", open: false });
  }

  const onVaultGroupCreated = useCallback(
    (groupId: Id<"vaultGroups">) => {
      vaultDispatch({ type: "setSelectedGroupId", id: groupId });
      clearSelection();
      setShowDuplicatesOnly(false);
    },
    [clearSelection]
  );

  const statsLabel = viewingDuplicates
    ? `${duplicateSetCount} duplicate set${duplicateSetCount === 1 ? "" : "s"} · ${filteredFiles.length} files`
    : `${vaultData?.groups.length ?? 0} collections • ${filteredFiles.length} files`;

  if (vaultData === undefined) {
    return <Loading message="Loading vault..." />;
  }

  return (
    <View className="flex-1">
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
      ) : (
        <VaultHeader
          selectedGroup={selectedGroup}
          onOpenGroupSelector={() => vaultDispatch({ type: "setShowGroupSelector", open: true })}
        />
      )}

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
        <VaultStatsBar statsLabel={statsLabel} />
      )}

      {!isSelecting && !viewingDuplicates && vaultData.groups.length > 0 ? (
        <VaultUploadBar
          effectiveGroupId={effectiveGroupId}
          uploading={uploading}
          onPickAndUpload={() => void pickAndUpload()}
        />
      ) : null}

      {filteredFiles.length === 0 ? (
        <EmptyState
          icon="cloud-upload-outline"
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
  const insets = useSafeAreaInsets();
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();

  if (!clerkLoaded) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Loading message="Loading..." />
      </View>
    );
  }

  if (!isSignedIn) {
    return <View className="flex-1 bg-background" style={{ paddingTop: insets.top }} />;
  }

  if (convexLoading || !isAuthenticated) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Loading message="Connecting..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <VaultContent />
    </View>
  );
}
