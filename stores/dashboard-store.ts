import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DashboardState {
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedGroupId: "",
      setSelectedGroupId: (id) => set({ selectedGroupId: id }),
    }),
    {
      name: "dashboard-storage",
    },
  ),
);
