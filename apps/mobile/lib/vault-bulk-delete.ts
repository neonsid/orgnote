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
  const chunks: Id<"vaultFiles">[][] = [];
  for (let i = 0; i < fileIds.length; i += MAX_BULK_VAULT_DELETE) {
    chunks.push(fileIds.slice(i, i + MAX_BULK_VAULT_DELETE));
  }
  const results = await Promise.all(chunks.map((chunk) => deleteBulk({ fileIds: chunk })));
  return results.reduce((sum, result) => sum + result.deletedCount, 0);
}
