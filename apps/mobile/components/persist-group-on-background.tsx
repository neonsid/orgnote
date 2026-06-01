import { AppState, type AppStateStatus } from "react-native";

import { useMountEffect } from "@/hooks/use-mount-effect";
import { savePersistedSelectedGroupId } from "@/lib/persisted-selected-group";
import type { Id } from "../../../convex/_generated/dataModel";

/** Flushes the selected group to AsyncStorage on mount and when the app backgrounds. */
export function PersistGroupOnBackground({
  userId,
  groupId,
}: {
  userId: string;
  groupId: Id<"groups">;
}) {
  useMountEffect(() => {
    void savePersistedSelectedGroupId(userId, groupId);

    function persist() {
      void savePersistedSelectedGroupId(userId, groupId);
    }

    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "background" || s === "inactive") {
        persist();
      }
    });
    return () => sub.remove();
  });

  return null;
}
