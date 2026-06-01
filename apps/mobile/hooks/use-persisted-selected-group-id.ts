import { useRef, useState } from "react";

import { useMountEffect } from "@/hooks/use-mount-effect";
import {
  loadPersistedSelectedGroupId,
  savePersistedSelectedGroupId,
} from "@/lib/persisted-selected-group";
import type { Id } from "../../../convex/_generated/dataModel";

type GroupRow = { _id: Id<"groups"> };

/**
 * Persists the selected bookmark collection per user (AsyncStorage).
 * Parent should remount with `key={userId}` when the user changes, and
 * `key={...-${hasGroups ? "ready" : "empty"}}` when groups first become available,
 * so restore runs via useMountEffect instead of a reactive useEffect.
 * Render {@link PersistGroupOnBackground} alongside this hook for background flush.
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
