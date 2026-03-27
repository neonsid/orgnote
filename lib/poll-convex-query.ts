import type { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const DEFAULT_INTERVAL_MS = 100;
const DEFAULT_MAX_ATTEMPTS = 100;

export async function waitForVaultUploadRequest(
  convex: ConvexReactClient,
  requestId: Id<"vaultUploadRequests">,
): Promise<{ uploadUrl: string; fileUrl: string }> {
  for (let i = 0; i < DEFAULT_MAX_ATTEMPTS; i++) {
    const row = await convex.query(api.vault.queries.getVaultUploadRequest, {
      requestId,
    });
    if (row?.status === "ready" && row.uploadUrl && row.fileUrl) {
      return { uploadUrl: row.uploadUrl, fileUrl: row.fileUrl };
    }
    if (row?.status === "failed") {
      throw new Error(row.error ?? "Failed to prepare upload");
    }
    await new Promise((r) => setTimeout(r, DEFAULT_INTERVAL_MS));
  }
  throw new Error("Timed out waiting for upload URL");
}

export async function waitForBookmarkDescriptionJob(
  convex: ConvexReactClient,
  jobId: Id<"bookmarkDescriptionJobs">,
): Promise<{
  success: boolean;
  title?: string;
  description?: string;
  error?: string;
  remainingSciraQuota?: number;
}> {
  for (let i = 0; i < DEFAULT_MAX_ATTEMPTS; i++) {
    const job = await convex.query(
      api.bookmarks.queries.getBookmarkDescriptionJob,
      { jobId },
    );
    if (job?.status === "complete") {
      return {
        success: job.success ?? false,
        title: job.title,
        description: job.description,
        error: job.error,
        remainingSciraQuota: job.remainingSciraQuota,
      };
    }
    await new Promise((r) => setTimeout(r, DEFAULT_INTERVAL_MS));
  }
  throw new Error("Timed out waiting for description");
}
