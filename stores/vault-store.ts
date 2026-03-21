import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Id } from "@/convex/_generated/dataModel";

interface VaultState {
  selectedGroupId: Id<"vaultGroups"> | null;
  setSelectedGroupId: (id: Id<"vaultGroups">) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      selectedGroupId: null,
      setSelectedGroupId: (id) => set({ selectedGroupId: id }),
    }),
    {
      name: "vault-storage",
    },
  ),
);
