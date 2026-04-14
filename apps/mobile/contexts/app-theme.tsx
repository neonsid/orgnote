import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { darkColors, lightColors, type AppColors } from "@/lib/theme-colors";

const STORAGE_KEY = "@orgnote/theme-preference";

export type ThemePreference = "light" | "dark" | "system";

async function readStoredThemePreference(): Promise<ThemePreference | null> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return null;
  } catch {
    /** Native module unavailable (Expo Go edge cases, web, misconfigured native build). */
    return null;
  }
}

async function writeStoredThemePreference(p: ThemePreference): Promise<void> {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    await AsyncStorage.setItem(STORAGE_KEY, p);
  } catch {
    /* ignore */
  }
}

type AppThemeContextValue = {
  colors: AppColors;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  resolvedScheme: "light" | "dark";
  isDark: boolean;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await readStoredThemePreference();
      if (!cancelled && stored) setPreferenceState(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void writeStoredThemePreference(p);
  }, []);

  const resolvedScheme: "light" | "dark" =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const colors = useMemo((): AppColors => {
    return resolvedScheme === "dark" ? darkColors : lightColors;
  }, [resolvedScheme]);

  const value = useMemo(
    () => ({
      colors,
      preference,
      setPreference,
      resolvedScheme,
      isDark: resolvedScheme === "dark",
    }),
    [colors, preference, setPreference, resolvedScheme]
  );

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

/** Safe when provider is optional (e.g. Storybook); defaults to light. */
export function useAppThemeColors(): AppColors {
  const ctx = useContext(AppThemeContext);
  return ctx?.colors ?? lightColors;
}
