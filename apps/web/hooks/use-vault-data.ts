import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useCallback } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useVaultStore } from "@/stores/vault-store";

export interface VaultFile {
  _id: Id<"vaultFiles">;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  groupId?: Id<"vaultGroups">;
  ownerId: string;
  _creationTime: number;
}

export interface VaultGroup {
  _id: Id<"vaultGroups">;
  _creationTime: number;
  title: string;
  color: string;
  userId: string;
}

export function useVaultData(isAuthenticated: boolean = true) {
  const { selectedGroupId, setSelectedGroupId } = useVaultStore();

  const vaultData = useQuery(
    api.vault.queries.getVaultData,
    isAuthenticated ? {} : "skip",
  );

  const isLoading = vaultData === undefined;

  const groups = useMemo((): VaultGroup[] => {
    if (!vaultData?.groups) return [];
    return vaultData.groups;
  }, [vaultData]);

  const effectiveGroupId = useMemo(() => {
    if (selectedGroupId && groups.some((g) => g._id === selectedGroupId)) {
      return selectedGroupId;
    }
    const latestGroup = [...groups].sort(
      (a, b) => b._creationTime - a._creationTime,
    )[0];
    return latestGroup?._id ?? "";
  }, [selectedGroupId, groups]);

  const files = useMemo((): VaultFile[] => {
    if (!vaultData?.files) return [];
    return vaultData.files
      .filter((f) => f.groupId === effectiveGroupId)
      .map((f) => ({
        _id: f._id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.url,
        thumbnailUrl: f.thumbnailUrl,
        groupId: f.groupId,
        ownerId: f.ownerId,
        _creationTime: f._creationTime,
      }));
  }, [vaultData, effectiveGroupId]);

  const selectGroup = useCallback(
    (id: Id<"vaultGroups">) => {
      setSelectedGroupId(id);
    },
    [setSelectedGroupId],
  );

  return {
    groups,
    files,
    effectiveGroupId,
    selectGroup,
    isLoading,
  };
}
