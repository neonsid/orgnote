import {
  createContext,
  use,
  type ReactNode,
} from "react";
import * as SystemUI from "expo-system-ui";

import { useMountEffect } from "@/hooks/use-mount-effect";
import { darkColors, type AppColors } from "@/lib/theme-colors";

type AppThemeContextValue = {
  colors: AppColors;
  resolvedScheme: "dark";
  isDark: true;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const colors = darkColors;

  useMountEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  });

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
  const ctx = use(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}

/** Safe when provider is optional; defaults to dark. */
function useAppThemeColors(): AppColors {
  const ctx = use(AppThemeContext);
  return ctx?.colors ?? darkColors;
}
