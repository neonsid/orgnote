/**
 * PUT upload to a presigned URL (e.g. R2/S3).
 *
 * We use XMLHttpRequest instead of `fetch` + `ReadableStream` + `duplex: "half"`
 * because that path can trigger TLS/HTTP2 negotiation issues (e.g.
 * `net::ERR_ALPN_NEGOTIATION_FAILED`) against some object-storage endpoints in
 * Chrome, while XHR upload uses a well-supported PUT with a File/Blob body and
 * exposes upload progress via `xhr.upload.onprogress`.
 */
export async function uploadFileToPresignedUrl(
  file: File,
  uploadUrl: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  const contentType = file.type || "application/octet-stream";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}: ${xhr.statusText || "Unknown error"}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed (network error)"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload aborted"));
    };

    if (file.size === 0) {
      onProgress(100);
    }

    xhr.send(file);
  });
}
