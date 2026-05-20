import * as WebBrowser from "expo-web-browser";
import { Appearance, Linking, Platform } from "react-native";

import { darkColors, lightColors } from "@/lib/theme-colors";
import { normalizeUrl } from "@/lib/utils";

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getBrowserOptions(): WebBrowser.WebBrowserOpenOptions {
  const scheme = Appearance.getColorScheme();
  const colors = scheme === "dark" ? darkColors : lightColors;

  return {
    showTitle: true,
    enableBarCollapsing: true,
    enableDefaultShareMenuItem: true,
    toolbarColor: colors.surface,
    secondaryToolbarColor: colors.background,
    controlsColor: colors.primaryAccent,
    dismissButtonStyle: "close",
    ...(Platform.OS === "ios"
      ? { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }
      : { createTask: false }),
  };
}

export async function warmUpInAppBrowser(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await WebBrowser.warmUpAsync();
  } catch {
    /* No Custom Tabs browser available on this device. */
  }
}

export async function openInAppBrowser(url: string, _title?: string): Promise<void> {
  if (!isNonEmptyString(url)) {
    return;
  }

  const normalizedUrl = normalizeUrl(url.trim());

  if (Platform.OS === "web") {
    await Linking.openURL(normalizedUrl);
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(normalizedUrl, getBrowserOptions());
  } catch {
    await Linking.openURL(normalizedUrl);
  }
}
