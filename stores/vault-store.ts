import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VaultState {
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      selectedGroupId: "",
      setSelectedGroupId: (id) => set({ selectedGroupId: id }),
    }),
    {
      name: "vault-storage",
    },
  ),
);
