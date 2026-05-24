import { StatusBar } from "expo-status-bar";
import { useLayoutEffect, type ReactNode } from "react";
import { Uniwind } from "uniwind";

import { useAppTheme } from "@/contexts/app-theme";

export function ThemeRoot({ children }: { children: ReactNode }) {
  const { isDark, resolvedScheme } = useAppTheme();

  useLayoutEffect(() => {
    Uniwind.setTheme(resolvedScheme);
  }, [resolvedScheme]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}
