import { StatusBar } from "expo-status-bar";
import { type ReactNode } from "react";

import { useAppTheme } from "@/contexts/app-theme";

export function ThemeRoot({ children }: { children: ReactNode }) {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}
