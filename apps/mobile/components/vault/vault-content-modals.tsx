import type { Dispatch } from "react";

import {
  VaultGroupSelectorModal,
  VaultMoveFileModal,
  CreateGroupModal,
  EditGroupModal,
  DeleteGroupModal,
} from "@/components/dialogs";
import {
  FileActionsModal,
  UploadProgressOverlay,
} from "@/components/vault";
import type { VaultTabUiAction } from "@/hooks/use-vault-tab-ui";
import type { VaultUploadStatus } from "@/hooks/use-vault-upload";
import type { Id } from "../../../../convex/_generated/dataModel";

type VaultGroup = {
  _id: Id<"vaultGroups">;
  title: string;
  color?: string;
};

type VaultFileSelection = {
  _id: Id<"vaultFiles">;
  name: string;
  url: string;
  type: string;
};

export function VaultContentModals({
  vaultDispatch,
  vaultData,
  selectedGroupId,
  selectedGroup,
  effectiveGroupId,
  showGroupSelector,
  showCreateGroup,
  showEditGroup,
  showDeleteGroup,
  movePickerOpen,
  selectedFile,
  moveTargetGroups,
  duplicateSetCount,
  viewingDuplicates,
  uploading,
  uploadStatus,
  isSelecting,
  onVaultGroupCreated,
  onSelectGroup,
  onSelectMoveTarget,
  onToggleDuplicatesView,
  onToggleSelection,
}: {
  vaultDispatch: Dispatch<VaultTabUiAction>;
  vaultData: { groups: VaultGroup[] };
  selectedGroupId: Id<"vaultGroups"> | null;
  selectedGroup: VaultGroup | null;
  effectiveGroupId: Id<"vaultGroups"> | null;
  showGroupSelector: boolean;
  showCreateGroup: boolean;
  showEditGroup: boolean;
  showDeleteGroup: boolean;
  movePickerOpen: boolean;
  selectedFile: VaultFileSelection | null;
  moveTargetGroups: VaultGroup[];
  duplicateSetCount: number;
  viewingDuplicates: boolean;
  uploading: boolean;
  uploadStatus: VaultUploadStatus | null;
  isSelecting: boolean;
  onVaultGroupCreated: (groupId: Id<"vaultGroups">) => void;
  onSelectGroup: (groupId: Id<"vaultGroups">) => void;
  onSelectMoveTarget: (groupId: Id<"vaultGroups">) => void;
  onToggleDuplicatesView: () => void;
  onToggleSelection: (fileId: Id<"vaultFiles">) => void;
}) {
  return (
    <>
      <VaultGroupSelectorModal
        visible={showGroupSelector}
        onClose={() => vaultDispatch({ type: "setShowGroupSelector", open: false })}
        groups={vaultData.groups}
        selectedGroupId={effectiveGroupId}
        onSelectGroup={onSelectGroup}
        onCreateGroup={() => vaultDispatch({ type: "groupSelectorToCreate" })}
        onRenameGroup={() => vaultDispatch({ type: "groupSelectorToEdit" })}
        onDeleteGroup={() => vaultDispatch({ type: "groupSelectorToDelete" })}
        duplicateSetCount={duplicateSetCount}
        viewingDuplicates={viewingDuplicates}
        onShowDuplicates={onToggleDuplicatesView}
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
          onToggleSelection(selectedFile._id);
          vaultDispatch({ type: "setSelectedFile", file: null });
        }}
      />

      <VaultMoveFileModal
        visible={movePickerOpen && !!selectedFile}
        onClose={() => vaultDispatch({ type: "setMovePickerOpen", open: false })}
        fileName={selectedFile?.name ?? ""}
        groups={moveTargetGroups}
        onSelectGroup={(groupId) => void onSelectMoveTarget(groupId)}
      />

      {uploading && uploadStatus ? <UploadProgressOverlay status={uploadStatus} /> : null}
    </>
  );
}
