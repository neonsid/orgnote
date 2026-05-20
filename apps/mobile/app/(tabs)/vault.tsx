import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  VaultGroupSelectorModal,
  VaultMoveFileModal,
  EditGroupModal,
  DeleteGroupModal,
} from "@/components/dialogs";
import { Loading, EmptyState } from "@/components/ui";
import {
  CreateVaultGroupModal,
  FileActionsModal,
  UploadProgressOverlay,
  VaultDuplicatesBanner,
  VaultFileList,
  VaultHeader,
  VaultMultiSelectToolbar,
  VaultStatsBar,
  VaultUploadBar,
  type VaultListFile,
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
    if (!viewingDuplicates) return filteredFiles.map((f) => f._id);
    return filteredFiles
      .filter((f) => !canonicalFileIds.has(f._id))
      .map((f) => f._id);
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

  const selectedFiles = useMemo(
    () =>
      filteredFiles
        .filter((f) => selectedIds.includes(f._id))
        .map((f) => ({
          _id: f._id,
          name: f.name,
          url: f.url,
          type: f.type,
        })),
    [filteredFiles, selectedIds]
  );

  const handleFilePress = useCallback(
    (file: VaultListFile) => {
      if (isSelecting) {
        if (viewingDuplicates && canonicalFileIds.has(file._id)) return;
        toggleSelection(file._id);
      } else {
        void promptOpenExternalUrl(file.url, file.name);
      }
    },
    [isSelecting, toggleSelection, viewingDuplicates, canonicalFileIds]
  );

  const handleFileLongPress = useCallback(
    (file: VaultListFile) => {
      if (viewingDuplicates && canonicalFileIds.has(file._id)) return;
      toggleSelection(file._id);
    },
    [toggleSelection, viewingDuplicates, canonicalFileIds]
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

      <CreateVaultGroupModal
        visible={showCreateGroup}
        onClose={() => vaultDispatch({ type: "setShowCreateGroup", open: false })}
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
