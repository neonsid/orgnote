import { useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useMountEffect } from "@/hooks/use-mount-effect";
import {
  loadPersistedSelectedGroupId,
  savePersistedSelectedGroupId,
} from "@/lib/persisted-selected-group";
import type { Id } from "../../../convex/_generated/dataModel";

type GroupRow = { _id: Id<"groups"> };

type PersistSnapshot = {
  userId: string | undefined | null;
  effectiveGroupId: Id<"groups"> | null;
  groupPreferenceRestored: boolean;
};

/**
 * Persists the selected bookmark collection per user (AsyncStorage) and flushes on background.
 * Parent should remount with `key={userId}` when the user changes, and
 * `key={...-${hasGroups ? "ready" : "empty"}}` when groups first become available,
 * so restore runs via useMountEffect instead of a reactive useEffect.
 */
export function usePersistedSelectedGroupId(
  userId: string | undefined | null,
  groups: GroupRow[] | undefined
) {
  const [selectedGroupId, setSelectedGroupIdState] = useState<Id<"groups"> | null>(null);
  const [groupPreferenceRestored, setGroupPreferenceRestored] = useState(false);
  const hasGroups = Boolean(groups && groups.length > 0);

  const effectiveGroupId =
    !groups || groups.length === 0
      ? null
      : selectedGroupId && groups.some((g) => g._id === selectedGroupId)
        ? selectedGroupId
        : groups[0]._id;

  const persistSnapshotRef = useRef<PersistSnapshot>({
    userId,
    effectiveGroupId,
    groupPreferenceRestored: false,
  });
  persistSnapshotRef.current = {
    userId,
    effectiveGroupId,
    groupPreferenceRestored: hasGroups && groupPreferenceRestored,
  };

  useMountEffect(() => {
    if (!userId || !groups?.length) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const stored = await loadPersistedSelectedGroupId(userId);
      if (cancelled) return;
      if (stored && groups.some((g) => g._id === stored)) {
        setSelectedGroupIdState(stored as Id<"groups">);
      }
      setGroupPreferenceRestored(true);
    })();

    return () => {
      cancelled = true;
    };
  });

  useMountEffect(() => {
    function persistLatest() {
      const { userId: uid, effectiveGroupId: groupId, groupPreferenceRestored: restored } =
        persistSnapshotRef.current;
      if (!uid || !groupId || !restored) return;
      void savePersistedSelectedGroupId(uid, groupId);
    }

    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "background" || s === "inactive") {
        persistLatest();
      }
    });
    return () => sub.remove();
  });

  function setSelectedGroupId(id: Id<"groups"> | null) {
    setSelectedGroupIdState(id);
    if (userId && id && hasGroups && groupPreferenceRestored) {
      void savePersistedSelectedGroupId(userId, id);
    }
  }

  return {
    selectedGroupId,
    setSelectedGroupId,
    groupPreferenceRestored: hasGroups && groupPreferenceRestored,
    effectiveGroupId,
  };
}
