import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";

import { useAppTheme } from "@/contexts/app-theme";

export function ThemeRoot({ children }: { children: ReactNode }) {
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.tabBarBg);
  }, [colors.tabBarBg]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}
