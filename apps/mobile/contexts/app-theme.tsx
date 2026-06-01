import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import * as SystemUI from "expo-system-ui";

import { darkColors, type AppColors } from "@/lib/theme-colors";

type AppThemeContextValue = {
  colors: AppColors;
  resolvedScheme: "dark";
  isDark: true;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const colors = darkColors;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.tabBarBg);
  }, [colors.tabBarBg]);

  const value: AppThemeContextValue = {
    colors,
    resolvedScheme: "dark",
    isDark: true,
  };

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}

/** Safe when provider is optional; defaults to dark. */
export function useAppThemeColors(): AppColors {
  const ctx = useContext(AppThemeContext);
  return ctx?.colors ?? darkColors;
}
