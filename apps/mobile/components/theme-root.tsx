import { StatusBar } from "expo-status-bar";
import { useLayoutEffect, type ReactNode } from "react";
import { Uniwind } from "uniwind";

export function ThemeRoot({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    Uniwind.setTheme("dark");
  }, []);

  return (
    <>
      <StatusBar style="light" />
      {children}
    </>
  );
}
