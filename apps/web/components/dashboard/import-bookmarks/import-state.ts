import { UNCATEGORIZED_CHROME_FOLDER } from "@/lib/bookmark-import";
import type { ParsedImportItem } from "@/lib/bookmark-import";

export type ImportViewState = {
  parsedItems: ParsedImportItem[] | null;
  chromeFolderKeys: string[];
  loadedFileLabel: string;
  chromeFolderKey: string;
  selectedIds: string[];
  targetGroupId: string;
  pendingByGroup: Record<string, ParsedImportItem[]>;
  isImporting: boolean;
  duplicateReviewVisible: boolean;
  pendingGroupExpanded: Record<string, boolean>;
  /** After `fileParsed`, user reviews URLs vs all groups before assign-to-group staging. */
  libraryCompareDismissed: boolean;
};

export type ImportViewAction =
  | { type: "reset" }
  | {
      type: "fileParsed";
      parsed: ParsedImportItem[];
      chromeFolderKeys: string[];
      fileName: string;
    }
  | { type: "setChromeFolder"; key: string }
  | { type: "toggleSelectedId"; id: string }
  | { type: "selectAllInFolder"; ids: string[] }
  | { type: "selectNone" }
  | { type: "addToGroup"; groupId: string; items: ParsedImportItem[] }
  | { type: "removeFromPending"; groupId: string; itemId: string }
  | { type: "setTargetGroup"; groupId: string }
  | { type: "setPendingGroupExpanded"; groupId: string; expanded: boolean }
  | { type: "setDuplicateReviewVisible"; visible: boolean }
  | { type: "setImporting"; importing: boolean }
  | { type: "dismissLibraryCompare" }
  | {
      type: "applyAfterImport";
      parsedItems: ParsedImportItem[] | null;
      loadedFileLabel: string;
    };

export const INITIAL_IMPORT_VIEW_STATE: ImportViewState = {
  parsedItems: null,
  chromeFolderKeys: [],
  loadedFileLabel: "",
  chromeFolderKey: UNCATEGORIZED_CHROME_FOLDER,
  selectedIds: [],
  targetGroupId: "",
  pendingByGroup: {},
  isImporting: false,
  duplicateReviewVisible: false,
  pendingGroupExpanded: {},
  libraryCompareDismissed: false,
};

export function importViewReducer(
  state: ImportViewState,
  action: ImportViewAction,
): ImportViewState {
  switch (action.type) {
    case "reset":
      return INITIAL_IMPORT_VIEW_STATE;
    case "fileParsed": {
      const keys = action.chromeFolderKeys;
      return {
        ...INITIAL_IMPORT_VIEW_STATE,
        parsedItems: action.parsed,
        chromeFolderKeys: keys,
        loadedFileLabel: action.fileName,
        chromeFolderKey: keys[0] ?? UNCATEGORIZED_CHROME_FOLDER,
        libraryCompareDismissed: false,
      };
    }
    case "setChromeFolder":
      return {
        ...state,
        chromeFolderKey: action.key,
        selectedIds: [],
      };
    case "toggleSelectedId": {
      const has = state.selectedIds.includes(action.id);
      return {
        ...state,
        selectedIds: has
          ? state.selectedIds.filter((x) => x !== action.id)
          : [...state.selectedIds, action.id],
      };
    }
    case "selectAllInFolder":
      return { ...state, selectedIds: [...action.ids] };
    case "selectNone":
      return { ...state, selectedIds: [] };
    case "addToGroup": {
      const gid = action.groupId;
      const list = state.pendingByGroup[gid]
        ? [...state.pendingByGroup[gid]!]
        : [];
      const existing = new Set(list.map((i) => i.id));
      for (const item of action.items) {
        if (!existing.has(item.id)) {
          list.push(item);
          existing.add(item.id);
        }
      }
      return {
        ...state,
        pendingByGroup: { ...state.pendingByGroup, [gid]: list },
        selectedIds: [],
      };
    }
    case "removeFromPending": {
      const list =
        state.pendingByGroup[action.groupId]?.filter(
          (i) => i.id !== action.itemId,
        ) ?? [];
      const next = { ...state.pendingByGroup };
      if (list.length === 0) delete next[action.groupId];
      else next[action.groupId] = list;
      return { ...state, pendingByGroup: next };
    }
    case "setTargetGroup":
      return { ...state, targetGroupId: action.groupId };
    case "setPendingGroupExpanded":
      return {
        ...state,
        pendingGroupExpanded: {
          ...state.pendingGroupExpanded,
          [action.groupId]: action.expanded,
        },
      };
    case "setDuplicateReviewVisible":
      return { ...state, duplicateReviewVisible: action.visible };
    case "setImporting":
      return { ...state, isImporting: action.importing };
    case "dismissLibraryCompare":
      return { ...state, libraryCompareDismissed: true };
    case "applyAfterImport":
      return {
        ...state,
        parsedItems: action.parsedItems,
        loadedFileLabel: action.loadedFileLabel,
        pendingByGroup: {},
        pendingGroupExpanded: {},
        selectedIds: [],
        isImporting: false,
        libraryCompareDismissed: true,
      };
  }
}
