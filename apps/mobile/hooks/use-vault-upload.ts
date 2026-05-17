import { useCallback, useState } from "react";
import { useConvex, useMutation } from "convex/react";

import { showThemedAlert } from "@/contexts/themed-alert";
import { waitForVaultUploadRequest } from "@/lib/poll-convex-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MAX_FILENAME_LENGTH } from "../../../convex/lib/constants";
import {
  isAllowedVaultUploadType,
  normalizeVaultFileTypeForUpload,
} from "../../../convex/lib/vault_upload_allowed";
import {
  VAULT_MAX_FILE_SIZE_BYTES,
  VAULT_MAX_FILES_PER_BATCH,
} from "@goldfish/shared";

export type VaultUploadStatus = {
  step: string;
  current: number;
  total: number;
  fileName?: string;
};

async function getDocumentPicker() {
  try {
    return await import("expo-document-picker");
  } catch {
    return null;
  }
}

async function getUploader() {
  try {
    const mod = await import("@/lib/upload-presigned-native");
    return mod.uploadLocalFileToPresignedUrl;
  } catch {
    return null;
  }
}

export function useVaultUpload(groupId: Id<"vaultGroups"> | null) {
  const convex = useConvex();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<VaultUploadStatus | null>(null);
  const requestPresignedUploadUrl = useMutation(api.vault.mutations.requestPresignedUploadUrl);
  const saveFileMetadata = useMutation(api.vault.mutations.saveFileMetadata);

  const pickAndUpload = useCallback(async () => {
    if (!groupId) {
      showThemedAlert(
        "Select a collection",
        "Choose a vault collection from the header before uploading files."
      );
      return;
    }

    const DocumentPicker = await getDocumentPicker();
    if (!DocumentPicker) {
      showThemedAlert(
        "Not available",
        "File picker is not available. Please rebuild the app with expo-document-picker installed."
      );
      return;
    }

    const uploadFn = await getUploader();
    if (!uploadFn) {
      showThemedAlert(
        "Not available",
        "File upload is not available. Please rebuild the app with expo-file-system installed."
      );
      return;
    }

    setUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const assets = result.assets.slice(0, VAULT_MAX_FILES_PER_BATCH);
      if (result.assets.length > VAULT_MAX_FILES_PER_BATCH) {
        showThemedAlert(
          "Too many files",
          `Only the first ${VAULT_MAX_FILES_PER_BATCH} files were uploaded (max ${VAULT_MAX_FILES_PER_BATCH} per batch).`
        );
      }

      type WorkItem = {
        asset: (typeof assets)[number];
        name: string;
        size: number;
        fileType: string;
        /** 1-based position in the trimmed batch */
        ordinal: number;
      };

      const workItems: WorkItem[] = [];
      for (const [index, asset] of assets.entries()) {
        const name = asset.name ?? "file";
        const ordinal = index + 1;
        if (name.length > MAX_FILENAME_LENGTH) {
          showThemedAlert(
            "Invalid file",
            `"${name}" is too long (max ${MAX_FILENAME_LENGTH} characters).`
          );
          continue;
        }
        const size = asset.size ?? 0;
        if (size > VAULT_MAX_FILE_SIZE_BYTES) {
          const mb = VAULT_MAX_FILE_SIZE_BYTES / (1024 * 1024);
          showThemedAlert("File too large", `"${name}" exceeds the ${mb} MB limit.`);
          continue;
        }
        const mime = asset.mimeType ?? "";
        const fileType = normalizeVaultFileTypeForUpload(name, mime);
        if (!isAllowedVaultUploadType(name, fileType)) {
          showThemedAlert(
            "Unsupported type",
            `"${name}" is not allowed. Use images, video, audio, PDF, EPUB, zip, text, or Word documents.`
          );
          continue;
        }
        workItems.push({ asset, name, size, fileType, ordinal });
      }

      if (workItems.length === 0) {
        return;
      }

      setUploadStatus({
        current: 0,
        total: workItems.length,
        step: `Uploading ${workItems.length} file${workItems.length === 1 ? "" : "s"}…`,
      });

      const settlements = await Promise.allSettled(
        workItems.map(async ({ asset, name, size, fileType, ordinal }) => {
          setUploadStatus({
            current: ordinal,
            total: workItems.length,
            fileName: name,
            step: "Preparing upload…",
          });
          const requestId = await requestPresignedUploadUrl({
            fileName: name,
            fileType,
          });
          const { uploadUrl, fileUrl } = await waitForVaultUploadRequest(convex, requestId);
          setUploadStatus({
            current: ordinal,
            total: workItems.length,
            fileName: name,
            step: "Uploading file…",
          });
          await uploadFn(asset.uri, fileType, uploadUrl);
          setUploadStatus({
            current: ordinal,
            total: workItems.length,
            fileName: name,
            step: "Saving to vault…",
          });
          await saveFileMetadata({
            fileName: name,
            fileType,
            fileSize: size,
            fileUrl,
            groupId,
          });
        })
      );

      const okCount = settlements.filter((s) => s.status === "fulfilled").length;
      const firstReject = settlements.find(
        (s): s is PromiseRejectedResult => s.status === "rejected"
      );

      if (firstReject && okCount < workItems.length) {
        const extra =
          firstReject.reason instanceof Error ? ` ${firstReject.reason.message}` : "";
        showThemedAlert("Some uploads failed", `${okCount}/${workItems.length} uploaded.${extra}`);
      } else if (okCount > 0) {
        showThemedAlert("Upload complete", `${okCount} file${okCount === 1 ? "" : "s"} uploaded.`);
      }
    } catch (e) {
      showThemedAlert(
        "Upload failed",
        e instanceof Error ? e.message : "Something went wrong while uploading."
      );
    } finally {
      setUploadStatus(null);
      setUploading(false);
    }
  }, [convex, groupId, requestPresignedUploadUrl, saveFileMetadata]);

  return { uploading, uploadStatus, pickAndUpload };
}
