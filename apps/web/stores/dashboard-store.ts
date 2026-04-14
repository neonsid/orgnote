import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Id } from "@/convex/_generated/dataModel";

interface DashboardState {
  selectedGroupId: Id<"groups"> | null;
  setSelectedGroupId: (id: Id<"groups">) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedGroupId: null,
      setSelectedGroupId: (id) => set({ selectedGroupId: id }),
    }),
    {
      name: "dashboard-storage",
    },
  ),
);
