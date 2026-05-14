import { useEffect, useMemo, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  loadPersistedSelectedGroupId,
  savePersistedSelectedGroupId,
} from "@/lib/persisted-selected-group";
import type { Id } from "../../../convex/_generated/dataModel";

type GroupRow = { _id: Id<"groups"> };

/**
 * Persists the selected bookmark collection per user (AsyncStorage) and flushes on background.
 * Parent should remount the consumer on `userId` change (`key={userId}`) so in-memory state resets.
 */
export function usePersistedSelectedGroupId(
  userId: string | undefined | null,
  groups: GroupRow[] | undefined
) {
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);
  const [groupPreferenceRestored, setGroupPreferenceRestored] = useState(false);

  const effectiveGroupId = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    if (selectedGroupId && groups.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    return groups[0]._id;
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!userId) return;
    if (!groups || groups.length === 0) {
      setGroupPreferenceRestored(false);
      return;
    }
    if (groupPreferenceRestored) return;

    let cancelled = false;
    void (async () => {
      const stored = await loadPersistedSelectedGroupId(userId);
      if (cancelled) return;
      if (stored && groups.some((g) => g._id === stored)) {
        setSelectedGroupId(stored as Id<"groups">);
      }
      setGroupPreferenceRestored(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, groups, groupPreferenceRestored]);

  useEffect(() => {
    if (!userId || !effectiveGroupId || !groupPreferenceRestored) return;

    const uid = userId;
    const groupId = effectiveGroupId;

    function persist() {
      void savePersistedSelectedGroupId(uid, groupId);
    }

    persist();

    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "background" || s === "inactive") {
        persist();
      }
    });
    return () => sub.remove();
  }, [userId, effectiveGroupId, groupPreferenceRestored]);

  return {
    selectedGroupId,
    setSelectedGroupId,
    groupPreferenceRestored,
    effectiveGroupId,
  };
}
