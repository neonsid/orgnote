/** Imperative color tokens — keep in sync with global.css Uniwind variants. */
export type AppColors = {
  primary: string;
  primaryForeground: string;
  primaryAccent: string;
  brandCyan: string;
  brandLogoBg: string;
  background: string;
  surface: string;
  card: string;
  cardForeground: string;
  muted: string;
  accent: string;
  border: string;
  borderLight: string;
  input: string;
  ring: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  overlay: string;
  selection: string;
  selectionMuted: string;
};

const lightColors: AppColors = {
  primary: "#0a0a0a",
  primaryForeground: "#fafafa",
  primaryAccent: "#4f46e5",
  brandCyan: "#06b6d4",
  brandLogoBg: "#eff6ff",
  background: "#ffffff",
  surface: "#ffffff",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  muted: "#f4f4f5",
  accent: "#f4f4f5",
  border: "#e4e4e7",
  borderLight: "#f4f4f5",
  input: "#e4e4e7",
  ring: "#a1a1aa",
  text: "#0a0a0a",
  textSecondary: "#18181b",
  textMuted: "#71717a",
  success: "#10b981",
  warning: "#eab308",
  error: "#dc2626",
  tabBarBg: "#ffffff",
  tabBarBorder: "#e4e4e7",
  tabBarActive: "#f4f4f5",
  overlay: "rgba(0,0,0,0.45)",
  selection: "rgba(79, 70, 229, 0.12)",
  selectionMuted: "rgba(79, 70, 229, 0.2)",
};

export const darkColors: AppColors = {
  primary: "#ffffff",
  primaryForeground: "#000000",
  primaryAccent: "#6366f1",
  brandCyan: "#22d3ee",
  brandLogoBg: "rgba(99, 102, 241, 0.14)",
  background: "#000000",
  surface: "#16181c",
  card: "#16181c",
  cardForeground: "#e7e9ea",
  muted: "#202327",
  accent: "#202327",
  border: "rgba(231, 233, 234, 0.12)",
  borderLight: "#202327",
  input: "rgba(231, 233, 234, 0.14)",
  ring: "#536471",
  text: "#e7e9ea",
  textSecondary: "#e7e9ea",
  textMuted: "#71767b",
  success: "#00ba7c",
  warning: "#ffad1f",
  error: "#f4212e",
  tabBarBg: "#000000",
  tabBarBorder: "rgba(231, 233, 234, 0.12)",
  tabBarActive: "rgba(255, 255, 255, 0.08)",
  overlay: "rgba(0,0,0,0.7)",
  selection: "rgba(99, 102, 241, 0.16)",
  selectionMuted: "rgba(99, 102, 241, 0.28)",
};
