import { useReducer } from "react";

import type { Id } from "../../../convex/_generated/dataModel";

export type VaultSelectedFileRow = {
  _id: Id<"vaultFiles">;
  name: string;
  url: string;
  type: string;
};

export type VaultTabUiState = {
  selectedGroupId: Id<"vaultGroups"> | null;
  showGroupSelector: boolean;
  showCreateGroup: boolean;
  showEditGroup: boolean;
  showDeleteGroup: boolean;
  movePickerOpen: boolean;
  selectedFile: VaultSelectedFileRow | null;
};

export type VaultTabUiAction =
  | { type: "setSelectedGroupId"; id: Id<"vaultGroups"> | null }
  | { type: "setShowGroupSelector"; open: boolean }
  | { type: "setShowCreateGroup"; open: boolean }
  | { type: "setShowEditGroup"; open: boolean }
  | { type: "setShowDeleteGroup"; open: boolean }
  | { type: "setMovePickerOpen"; open: boolean }
  | { type: "setSelectedFile"; file: VaultSelectedFileRow | null }
  | { type: "groupSelectorToCreate" }
  | { type: "groupSelectorToEdit" }
  | { type: "groupSelectorToDelete" }
  | { type: "openMovePicker" }
  | { type: "afterMoveSuccess" };

export const initialVaultTabUi: VaultTabUiState = {
  selectedGroupId: null,
  showGroupSelector: false,
  showCreateGroup: false,
  showEditGroup: false,
  showDeleteGroup: false,
  movePickerOpen: false,
  selectedFile: null,
};

export function vaultTabUiReducer(state: VaultTabUiState, action: VaultTabUiAction): VaultTabUiState {
  switch (action.type) {
    case "setSelectedGroupId":
      return { ...state, selectedGroupId: action.id };
    case "setShowGroupSelector":
      return { ...state, showGroupSelector: action.open };
    case "setShowCreateGroup":
      return { ...state, showCreateGroup: action.open };
    case "setShowEditGroup":
      return { ...state, showEditGroup: action.open };
    case "setShowDeleteGroup":
      return { ...state, showDeleteGroup: action.open };
    case "setMovePickerOpen":
      return { ...state, movePickerOpen: action.open };
    case "setSelectedFile":
      return { ...state, selectedFile: action.file };
    case "groupSelectorToCreate":
      return { ...state, showGroupSelector: false, showCreateGroup: true };
    case "groupSelectorToEdit":
      return { ...state, showGroupSelector: false, showEditGroup: true };
    case "groupSelectorToDelete":
      return { ...state, showGroupSelector: false, showDeleteGroup: true };
    case "openMovePicker":
      return { ...state, movePickerOpen: true };
    case "afterMoveSuccess":
      return { ...state, movePickerOpen: false, selectedFile: null };
    default:
      return state;
  }
}

export function useVaultTabUiReducer() {
  return useReducer(vaultTabUiReducer, initialVaultTabUi);
}
