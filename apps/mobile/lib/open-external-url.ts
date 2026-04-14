import { Linking, Platform, Share } from "react-native";

/**
 * Prefer the system share sheet so the user can pick an app (browser, Drive, etc.)
 * instead of always opening the default browser via `Linking.openURL`.
 */
export async function promptOpenExternalUrl(url: string, title?: string): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Share.share(
        { message: url, title: title ?? "Open link" },
        { dialogTitle: "Open with" }
      );
      return;
    }
    await Share.share({ url, title: title ?? "Open link" });
  } catch {
    await Linking.openURL(url);
  }
}
