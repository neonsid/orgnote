export type AppColors = {
  primary: string;
  primaryAccent: string;
  background: string;
  surface: string;
  muted: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  tabBarBg: string;
  tabBarBorder: string;
  overlay: string;
  /** Selection / focus ring */
  selection: string;
  selectionMuted: string;
};

export const lightColors: AppColors = {
  primary: "#18181b",
  primaryAccent: "#3b82f6",
  background: "#fafafa",
  surface: "#ffffff",
  muted: "#f4f4f5",
  border: "#e4e4e7",
  borderLight: "#f4f4f5",
  text: "#18181b",
  textSecondary: "#71717a",
  textMuted: "#a1a1aa",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  tabBarBg: "#ffffff",
  tabBarBorder: "#e4e4e7",
  overlay: "rgba(0,0,0,0.45)",
  selection: "#18181b",
  selectionMuted: "#e4e4e7",
};

export const darkColors: AppColors = {
  primary: "#fafafa",
  primaryAccent: "#60a5fa",
  background: "#09090b",
  surface: "#18181b",
  muted: "#27272a",
  border: "#3f3f46",
  borderLight: "#27272a",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
  tabBarBg: "#18181b",
  tabBarBorder: "#3f3f46",
  overlay: "rgba(0,0,0,0.65)",
  selection: "#60a5fa",
  selectionMuted: "#27272a",
};
