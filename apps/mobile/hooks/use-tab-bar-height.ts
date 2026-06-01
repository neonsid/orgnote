import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_CONTENT_HEIGHT } from "@/lib/constants";

/** Total height of the bottom tab bar including safe-area inset. */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);
  return TAB_BAR_CONTENT_HEIGHT + bottomInset;
}

/** Extra scroll padding above the tab bar. */
export function useTabBarScrollPadding(extra = 16) {
  return useTabBarHeight() + extra;
}
