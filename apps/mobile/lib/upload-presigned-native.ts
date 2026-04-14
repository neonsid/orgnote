/**
 * PUT a local file (e.g. from document picker) to an R2/S3 presigned URL.
 * Uses expo-file-system/legacy which streams the file body without loading it all into RAM.
 */
export async function uploadLocalFileToPresignedUrl(
  fileUri: string,
  contentType: string,
  uploadUrl: string
): Promise<void> {
  const LegacyFS = await import("expo-file-system/legacy");

  const result = await LegacyFS.uploadAsync(uploadUrl, fileUri, {
    httpMethod: "PUT",
    uploadType: LegacyFS.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
    },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (${result.status}): ${result.body?.slice(0, 200) ?? ""}`);
  }
}
