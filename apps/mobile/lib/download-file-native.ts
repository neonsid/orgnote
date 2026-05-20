import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Share } from "react-native";
import { File, Paths } from "expo-file-system";

import { showThemedAlert } from "@/contexts/themed-alert";

/**
 * Download a remote file to the device.
 * On Android, save directly to the user's Downloads folder.
 * On iOS, present the native share sheet.
 */
const DOWNLOADS_DIR_URI_KEY = "@orgnote/downloads-directory-uri";

export type DownloadResult = {
  fileName: string;
  folderLabel: string;
};

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

function getFolderLabelFromDirectoryUri(directoryUri: string): string {
  try {
    const decoded = decodeURIComponent(directoryUri);
    const match = decoded.match(/:([^:/]+)$/);
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    /* fall through */
  }
  return "Downloads";
}

export function showDownloadCompleteAlert({ fileName, folderLabel }: DownloadResult): void {
  showThemedAlert(
    "Download complete",
    Platform.OS === "ios"
      ? `"${fileName}" is ready.\n\nIf you saved it from the share sheet, check the folder you chose in the Files app.`
      : `"${fileName}" was saved.\n\nFolder: ${folderLabel}`
  );
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
): Promise<DownloadResult> {
  const safeName = sanitizeFileName(fileName);
  const destination = new File(Paths.cache, safeName);

  try {
    if (destination.exists) {
      destination.delete();
    }
    await File.downloadFileAsync(url, destination);

    if (Platform.OS === "ios") {
      await Share.share({ url: destination.uri, title: fileName });
      const result = { fileName: safeName, folderLabel: "Files app" };
      showDownloadCompleteAlert(result);
      return result;
    }

    const LegacyFS = await import("expo-file-system/legacy");
    let directoryUri = await getAndroidDownloadsDirectoryUri(LegacyFS);
    const folderLabel = getFolderLabelFromDirectoryUri(directoryUri);
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
      return targetName;
    }

    let savedFileName = safeName;
    try {
      savedFileName = await writeIntoDirectory(directoryUri);
    } catch (error) {
      // The stored SAF permission may be stale after reinstall or if the user revoked it.
      await AsyncStorage.removeItem(DOWNLOADS_DIR_URI_KEY);
      directoryUri = await getAndroidDownloadsDirectoryUri(LegacyFS);

      try {
        savedFileName = await writeIntoDirectory(directoryUri);
      } catch {
        savedFileName = await writeIntoDirectory(directoryUri, `_${Date.now()}`);
      }
    }

    const result = { fileName: savedNameWithExtension(savedFileName, fileName), folderLabel };
    showDownloadCompleteAlert(result);
    return result;
  } finally {
    if (destination.exists) {
      destination.delete();
    }
  }
}

function savedNameWithExtension(savedBaseName: string, originalFileName: string): string {
  const { extension } = splitFileName(originalFileName);
  if (!extension || savedBaseName.endsWith(`.${extension}`)) {
    return savedBaseName;
  }
  return `${savedBaseName}.${extension}`;
}
