import { useReducer } from "react";

import type { FilterType } from "@/components/dialogs";

type BookmarksTabUiState = {
  searchQuery: string;
  filter: FilterType;
  showGroupSelector: boolean;
  showFilter: boolean;
  showAddBookmark: boolean;
  showCreateGroup: boolean;
  showEditGroup: boolean;
  showDeleteGroup: boolean;
};

type BookmarksTabUiAction =
  | { type: "setSearchQuery"; query: string }
  | { type: "setFilter"; filter: FilterType }
  | { type: "setShowGroupSelector"; open: boolean }
  | { type: "setShowFilter"; open: boolean }
  | { type: "setShowAddBookmark"; open: boolean }
  | { type: "setShowCreateGroup"; open: boolean }
  | { type: "setShowEditGroup"; open: boolean }
  | { type: "setShowDeleteGroup"; open: boolean }
  | { type: "groupSelectorToCreate" }
  | { type: "groupSelectorToEdit" }
  | { type: "groupSelectorToDelete" };

const initialBookmarksTabUi: BookmarksTabUiState = {
  searchQuery: "",
  filter: "all",
  showGroupSelector: false,
  showFilter: false,
  showAddBookmark: false,
  showCreateGroup: false,
  showEditGroup: false,
  showDeleteGroup: false,
};

function bookmarksTabUiReducer(
  state: BookmarksTabUiState,
  action: BookmarksTabUiAction,
): BookmarksTabUiState {
  switch (action.type) {
    case "setSearchQuery":
      return { ...state, searchQuery: action.query };
    case "setFilter":
      return { ...state, filter: action.filter };
    case "setShowGroupSelector":
      return { ...state, showGroupSelector: action.open };
    case "setShowFilter":
      return { ...state, showFilter: action.open };
    case "setShowAddBookmark":
      return { ...state, showAddBookmark: action.open };
    case "setShowCreateGroup":
      return { ...state, showCreateGroup: action.open };
    case "setShowEditGroup":
      return { ...state, showEditGroup: action.open };
    case "setShowDeleteGroup":
      return { ...state, showDeleteGroup: action.open };
    case "groupSelectorToCreate":
      return { ...state, showGroupSelector: false, showCreateGroup: true };
    case "groupSelectorToEdit":
      return { ...state, showGroupSelector: false, showEditGroup: true };
    case "groupSelectorToDelete":
      return { ...state, showGroupSelector: false, showDeleteGroup: true };
    default:
      return state;
  }
}

export function useBookmarksTabUiReducer() {
  return useReducer(bookmarksTabUiReducer, initialBookmarksTabUi);
}
