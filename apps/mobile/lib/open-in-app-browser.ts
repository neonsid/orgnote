import { router } from "expo-router";
import { Linking, Platform } from "react-native";

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function openInAppBrowser(url: string, title?: string): Promise<void> {
  if (!isNonEmptyString(url)) {
    return;
  }

  if (Platform.OS === "web") {
    await Linking.openURL(url);
    return;
  }

  router.push({
    pathname: "/browser",
    params: isNonEmptyString(title) ? { url, title } : { url },
  });
}
