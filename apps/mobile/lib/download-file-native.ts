import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Share } from "react-native";
import { File, Paths } from "expo-file-system";

/**
 * Download a remote file to the device.
 * On Android, save directly to the user's Downloads folder.
 * On iOS, present the native share sheet.
 */
const DOWNLOADS_DIR_URI_KEY = "@orgnote/downloads-directory-uri";

function sanitizeFileName(fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized || "download";
}

function splitFileName(fileName: string): { baseName: string; extension: string } {
  const safeName = sanitizeFileName(fileName);
  const lastDot = safeName.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === safeName.length - 1) {
    return { baseName: safeName, extension: "" };
  }

  return {
    baseName: safeName.slice(0, lastDot),
    extension: safeName.slice(lastDot + 1),
  };
}

async function getAndroidDownloadsDirectoryUri(
  LegacyFS: typeof import("expo-file-system/legacy")
): Promise<string> {
  const savedUri = await AsyncStorage.getItem(DOWNLOADS_DIR_URI_KEY);
  if (savedUri) {
    return savedUri;
  }

  const initialUri = LegacyFS.StorageAccessFramework.getUriForDirectoryInRoot("Download");
  const permission = await LegacyFS.StorageAccessFramework.requestDirectoryPermissionsAsync(
    initialUri
  );

  if (!permission.granted) {
    throw new Error("Allow access to your Downloads folder to save files.");
  }

  await AsyncStorage.setItem(DOWNLOADS_DIR_URI_KEY, permission.directoryUri);
  return permission.directoryUri;
}

export async function downloadAndShareFile(
  url: string,
  fileName: string,
  mimeType = "application/octet-stream"
): Promise<void> {
  const safeName = sanitizeFileName(fileName);
  const destination = new File(Paths.cache, safeName);

  try {
    if (destination.exists) {
      destination.delete();
    }
    await File.downloadFileAsync(url, destination);

    if (Platform.OS === "ios") {
      await Share.share({ url: destination.uri, title: fileName });
      return;
    }

    const LegacyFS = await import("expo-file-system/legacy");
    let directoryUri = await getAndroidDownloadsDirectoryUri(LegacyFS);
    const { baseName } = splitFileName(fileName);

    async function writeIntoDirectory(targetDirectoryUri: string, suffix = "") {
      const targetName = `${baseName}${suffix}`;
      const targetUri = await LegacyFS.StorageAccessFramework.createFileAsync(
        targetDirectoryUri,
        targetName,
        mimeType
      );
      const fileBase64 = await destination.base64();
      await LegacyFS.StorageAccessFramework.writeAsStringAsync(targetUri, fileBase64, {
        encoding: LegacyFS.EncodingType.Base64,
      });
      return targetUri;
    }

    try {
      await writeIntoDirectory(directoryUri);
    } catch (error) {
      // The stored SAF permission may be stale after reinstall or if the user revoked it.
      await AsyncStorage.removeItem(DOWNLOADS_DIR_URI_KEY);
      directoryUri = await getAndroidDownloadsDirectoryUri(LegacyFS);

      try {
        await writeIntoDirectory(directoryUri);
      } catch {
        await writeIntoDirectory(directoryUri, `_${Date.now()}`);
      }
    }
  } finally {
    if (destination.exists) {
      destination.delete();
    }
  }
}
