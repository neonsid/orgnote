import type { Id } from "../../../convex/_generated/dataModel";
import { MAX_BULK_VAULT_DELETE } from "../../../convex/lib/constants";

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

export async function deleteVaultFilesInBatches(
  deleteBulk: (args: { fileIds: Id<"vaultFiles">[] }) => Promise<{ deletedCount: number }>,
  fileIds: Id<"vaultFiles">[]
): Promise<number> {
  let deletedCount = 0;
  for (let i = 0; i < fileIds.length; i += MAX_BULK_VAULT_DELETE) {
    const chunk = fileIds.slice(i, i + MAX_BULK_VAULT_DELETE);
    const result = await deleteBulk({ fileIds: chunk });
    deletedCount += result.deletedCount;
  }
  return deletedCount;
}
