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
  groupId?: Id<"vaultGroups">;
  ownerId: string;
  createdAt: number;
}

export interface VaultGroup {
  _id: Id<"vaultGroups">;
  title: string;
  color: string;
  userId: string;
  createdAt: number;
}

export function useVaultData(isAuthenticated: boolean = true) {
  const { selectedGroupId, setSelectedGroupId } = useVaultStore();

  const vaultData = useQuery(
    api.vault.getVaultData,
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
      (a, b) => b.createdAt - a.createdAt,
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
        groupId: f.groupId,
        ownerId: f.ownerId,
        createdAt: f.createdAt,
      }));
  }, [vaultData, effectiveGroupId]);

  const selectGroup = useCallback(
    (id: string) => {
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
